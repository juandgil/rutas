import { injectable, inject } from 'inversify';
import { IEventoService } from '../interfaces/evento-service.interface';
import { IEventoRepository } from '../../domain/repositories/evento.repository';
import { TYPES } from '../../infrastructure/ioc/types';
import { Evento } from '../../domain/entities/evento.entity';
import { IPubSubService } from '../interfaces/pubsub-service.interface';
import { ICacheService } from '../../infrastructure/cache/redis-client';
import { v4 as uuidv4 } from 'uuid';
// Importar APIs externas
import { IGpsApi, ITraficoClimaApi, NivelTrafico } from '../../domain/interfaces/external-apis.interface';

@injectable()
export class EventoService implements IEventoService {
  private readonly CACHE_TTL = 3600; // 1 hora en segundos
  private readonly TOPIC_EVENTOS = 'eventos';

  constructor(
    @inject(TYPES.IEventoRepository) private readonly eventoRepository: IEventoRepository,
    @inject(TYPES.IPubSubService) private readonly pubSubService: IPubSubService,
    @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    // Inyectar APIs externas
    @inject(TYPES.IGpsApi) private readonly gpsApi: IGpsApi,
    @inject(TYPES.ITraficoClimaApi) private readonly traficoClimaApi: ITraficoClimaApi
  ) {}

  async registrarEvento(evento: Partial<Evento>): Promise<Evento> {
    // Validar datos del evento
    if (!evento.tipo) {
      throw new Error('El tipo de evento es obligatorio');
    }
    
    if (!evento.descripcion) {
      throw new Error('La descripción del evento es obligatoria');
    }
    
    if (!evento.ciudadId) {
      throw new Error('El ID de la ciudad es obligatorio');
    }
    
    // Para eventos relacionados con tráfico o clima, validar con la API externa
    if (evento.tipo === 'TRAFICO') {
      try {
        const condicionesTrafico = await this.traficoClimaApi.obtenerCondicionesTrafico(evento.ciudadId);
        
        // Solo registrar si el nivel de tráfico es alto (validación)
        if (condicionesTrafico.nivel !== NivelTrafico.ALTO && 
            evento.impacto !== 'ALTO' && evento.impacto !== 'CRITICO') {
          throw new Error('No se puede registrar un evento de tráfico cuando las condiciones son normales o de nivel medio');
        }
        
        // Añadir información adicional al evento
        evento.metadatos = {
          ...evento.metadatos,
          nivelTraficoActual: condicionesTrafico.nivel,
          reporteTrafico: condicionesTrafico.descripcion
        };
      } catch (error: any) {
        console.warn(`No se pudo verificar las condiciones de tráfico para ${evento.ciudadId}:`, error);
        // Si el evento es de alto impacto, permitir su creación a pesar del error
        if (evento.impacto === 'ALTO' || evento.impacto === 'CRITICO') {
          console.log(`Permitiendo creación de evento de tráfico con impacto ${evento.impacto} a pesar de no poder verificar condiciones`);
          evento.metadatos = {
            ...evento.metadatos,
            verificacionFallida: true,
            motivoFallo: error.message,
            mensajeAdicional: "Evento registrado sin verificación de condiciones debido a su alto impacto"
          };
        } else {
          throw new Error(`No se puede verificar las condiciones de tráfico actuales. Se requiere impacto ALTO o CRITICO para crear sin verificación.`);
        }
      }
    } else if (evento.tipo === 'CLIMA') {
      try {
        const condicionesClima = await this.traficoClimaApi.obtenerCondicionesClima(evento.ciudadId);
        
        // Añadir información adicional al evento
        evento.metadatos = {
          ...evento.metadatos,
          condicionClimaActual: condicionesClima.estado,
          reporteClima: condicionesClima.descripcion
        };
      } catch (error: any) {
        console.warn(`No se pudo verificar las condiciones climáticas para ${evento.ciudadId}:`, error);
        
        // Si el evento es de alto impacto, permitir su creación a pesar del error
        if (evento.impacto === 'ALTO' || evento.impacto === 'CRITICO') {
          console.log(`Permitiendo creación de evento climático con impacto ${evento.impacto} a pesar de no poder verificar condiciones`);
          evento.metadatos = {
            ...evento.metadatos,
            verificacionFallida: true,
            motivoFallo: error.message,
            mensajeAdicional: "Evento registrado sin verificación de condiciones debido a su alto impacto"
          };
        } else {
          throw new Error(`No se puede verificar las condiciones climáticas actuales. Se requiere impacto ALTO o CRITICO para crear sin verificación.`);
        }
      }
    }
    
    // Si el evento está asociado a un equipo, obtener su ubicación actual
    if (evento.equipoId) {
      try {
        const ubicacionGps = await this.gpsApi.obtenerUbicacion(evento.equipoId);
        
        // Añadir ubicación al evento
        if (ubicacionGps) {
          evento.metadatos = {
            ...evento.metadatos,
            ubicacionEquipo: {
              latitud: ubicacionGps.latitud,
              longitud: ubicacionGps.longitud,
              timestamp: ubicacionGps.timestamp
            }
          };
        }
      } catch (error) {
        console.warn(`No se pudo obtener la ubicación del equipo ${evento.equipoId}:`, error);
      }
    }

    // Asignar ID y fechas
    const nuevoEvento: Evento = new Evento({
      ...evento,
      id: uuidv4(),
      fecha: new Date(),
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Guardar en base de datos
    const eventoCreado = await this.eventoRepository.create(nuevoEvento);

    // Invalidar cache
    await this.cacheService.del(`eventos:ciudad:${eventoCreado.ciudadId}`);
    if (eventoCreado.equipoId) {
      await this.cacheService.del(`eventos:equipo:${eventoCreado.equipoId}`);
    }
    await this.cacheService.del('eventos:activos');

    // Publicar evento para notificar a los servicios interesados
    await this.pubSubService.publicar(this.TOPIC_EVENTOS, eventoCreado);

    return eventoCreado;
  }
  
  async obtenerEvento(id: string): Promise<Evento | null> {
    // Intentar obtener de cache
    const cachedEvento = await this.cacheService.get<Evento>(`evento:${id}`);
    
    if (cachedEvento) {
      return cachedEvento;
    }

    // Si no está en cache, obtener de la base de datos
    const evento = await this.eventoRepository.findById(id);
    
    if (evento) {
      // Guardar en cache
      await this.cacheService.set(`evento:${id}`, evento, this.CACHE_TTL);
    }
    
    return evento;
  }

  async obtenerEventosActivos(): Promise<Evento[]> {
    // Intentar obtener de cache
    const cachedEventos = await this.cacheService.get<Evento[]>('eventos:activos');
    
    if (cachedEventos) {
      return cachedEventos;
    }

    // Si no está en cache, obtener de la base de datos
    const eventos = await this.eventoRepository.findActivos();
    
    // Guardar en cache
    await this.cacheService.set('eventos:activos', eventos, this.CACHE_TTL);
    
    return eventos;
  }

  async obtenerEventosPorCiudad(ciudadId: string): Promise<Evento[]> {
    // Intentar obtener de cache
    const cachedEventos = await this.cacheService.get<Evento[]>(`eventos:ciudad:${ciudadId}`);
    
    if (cachedEventos) {
      return cachedEventos;
    }

    // Si no está en cache, obtener de la base de datos
    const eventos = await this.eventoRepository.findByCiudad(ciudadId);
    
    // Guardar en cache
    await this.cacheService.set(`eventos:ciudad:${ciudadId}`, eventos, this.CACHE_TTL);
    
    return eventos;
  }

  async obtenerEventosPorEquipo(equipoId: string): Promise<Evento[]> {
    // Intentar obtener de cache
    const cachedEventos = await this.cacheService.get<Evento[]>(`eventos:equipo:${equipoId}`);
    
    if (cachedEventos) {
      return cachedEventos;
    }

    // Si no está en cache, obtener de la base de datos
    const eventos = await this.eventoRepository.findByEquipo(equipoId);
    
    // Guardar en cache
    await this.cacheService.set(`eventos:equipo:${equipoId}`, eventos, this.CACHE_TTL);
    
    return eventos;
  }

  async marcarInactivo(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.marcarInactivo(id);
    
    // Invalidar cache
    await this.cacheService.del(`eventos:ciudad:${evento.ciudadId}`);
    await this.cacheService.del(`eventos:equipo:${evento.equipoId}`);
    await this.cacheService.del('eventos:activos');
    await this.cacheService.del(`evento:${id}`);
    
    // Notificar que el evento se ha marcado como inactivo
    await this.pubSubService.publicar(`${this.TOPIC_EVENTOS}:inactivo`, evento);
    
    return evento;
  }
} 
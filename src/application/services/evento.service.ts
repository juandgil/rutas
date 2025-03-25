import { injectable, inject } from 'inversify';
import { IEventoService } from '../interfaces/evento-service.interface';
import { IEventoRepository } from '../../domain/repositories/evento.repository';
import { TYPES } from '../../infrastructure/ioc/types';
import { Evento } from '../../domain/entities/evento.entity';
import { IPubSubService } from '../interfaces/pubsub-service.interface';
import { ICacheService } from '../../infrastructure/cache/redis-client';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class EventoService implements IEventoService {
  private readonly CACHE_TTL = 3600; // 1 hora en segundos
  private readonly TOPIC_EVENTOS = 'eventos';

  constructor(
    @inject(TYPES.IEventoRepository) private eventoRepository: IEventoRepository,
    @inject(TYPES.IPubSubService) private pubSubService: IPubSubService,
    @inject(TYPES.ICacheService) private cacheService: ICacheService
  ) {}

  async registrarEvento(evento: Partial<Evento>): Promise<Evento> {
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
    await this.cacheService.del(`eventos:equipo:${eventoCreado.equipoId}`);
    await this.cacheService.del('eventos:activos');

    // Publicar evento para notificar a los servicios interesados
    await this.pubSubService.publicar(this.TOPIC_EVENTOS, eventoCreado);

    return eventoCreado;
  }

  async obtenerEventosActivos(): Promise<Evento[]> {
    // Intentar obtener de cache
    const cachedEventos = await this.cacheService.get('eventos:activos');
    
    if (cachedEventos) {
      return JSON.parse(cachedEventos);
    }

    // Si no está en cache, obtener de la base de datos
    const eventos = await this.eventoRepository.findActivos();
    
    // Guardar en cache
    await this.cacheService.set('eventos:activos', JSON.stringify(eventos), this.CACHE_TTL);
    
    return eventos;
  }

  async obtenerEventosPorCiudad(ciudadId: string): Promise<Evento[]> {
    // Intentar obtener de cache
    const cachedEventos = await this.cacheService.get(`eventos:ciudad:${ciudadId}`);
    
    if (cachedEventos) {
      return JSON.parse(cachedEventos);
    }

    // Si no está en cache, obtener de la base de datos
    const eventos = await this.eventoRepository.findByCiudad(ciudadId);
    
    // Guardar en cache
    await this.cacheService.set(`eventos:ciudad:${ciudadId}`, JSON.stringify(eventos), this.CACHE_TTL);
    
    return eventos;
  }

  async obtenerEventosPorEquipo(equipoId: string): Promise<Evento[]> {
    // Intentar obtener de cache
    const cachedEventos = await this.cacheService.get(`eventos:equipo:${equipoId}`);
    
    if (cachedEventos) {
      return JSON.parse(cachedEventos);
    }

    // Si no está en cache, obtener de la base de datos
    const eventos = await this.eventoRepository.findByEquipo(equipoId);
    
    // Guardar en cache
    await this.cacheService.set(`eventos:equipo:${equipoId}`, JSON.stringify(eventos), this.CACHE_TTL);
    
    return eventos;
  }

  async marcarInactivo(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.marcarInactivo(id);
    
    // Invalidar cache
    await this.cacheService.del(`eventos:ciudad:${evento.ciudadId}`);
    await this.cacheService.del(`eventos:equipo:${evento.equipoId}`);
    await this.cacheService.del('eventos:activos');
    
    // Notificar que el evento se ha marcado como inactivo
    await this.pubSubService.publicar(`${this.TOPIC_EVENTOS}:inactivo`, evento);
    
    return evento;
  }
} 
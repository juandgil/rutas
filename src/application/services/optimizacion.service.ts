import { injectable, inject } from 'inversify';
import { IOptimizacionService } from '../interfaces/optimizacion-service.interface';
import { TYPES } from '../../infrastructure/ioc/types';
import { IEnvioRepository } from '../../domain/repositories/envio.repository';
import { IEquipoRepository } from '../../domain/repositories/equipo.repository';
import { IVehiculoRepository } from '../../domain/repositories/vehiculo.repository';
import { IRutaRepository } from '../../domain/repositories/ruta.repository';
import { IGpsRepository } from '../../domain/repositories/gps.repository';
import { ISlaRepository } from '../../domain/repositories/sla.repository';
import { IEventoRepository } from '../../domain/repositories/evento.repository';
import { IPubSubService } from '../interfaces/pubsub-service.interface';
import { ICacheService } from '../../infrastructure/cache/redis-client';
import { Ruta, EstadoRuta } from '../../domain/entities/ruta.entity';
import { Envio, EstadoEnvio } from '../../domain/entities/envio.entity';
import { Sla } from '../../domain/entities/sla.entity';
import { Vehiculo } from '../../domain/entities/vehiculo.entity';
import { v4 as uuidv4 } from 'uuid';
// Importar interfaces de APIs externas
import { 
  IGpsApi, 
  ITraficoClimaApi, 
  IVehiculoApi,
  NivelTrafico,
  NivelImpacto,
  ImpactoRuta,
  Coordenadas
} from '../../domain/interfaces/external-apis.interface';
import { Equipo } from '../../domain/entities/equipo.entity';
import { Evento, TipoEvento } from '../../domain/entities/evento.entity';
import { OptimizarRutaRequestDto } from '../dtos/ruta.dto';

// Definición interna temporal para TramoDto
interface TramoDto {
  id: string;
  origen: string;
  destino: string;
  distancia: number;
  tiempoEstimado: number;
  ordenEntrega: number;
  ciudadId: string;
  latitudOrigen: number;
  longitudOrigen: number;
  latitudDestino: number;
  longitudDestino: number;
}

// Definición interna temporal para OptimizarRutaResponseDto
interface OptimizarRutaResponseDto {
  rutaId: string;
  equipoId: string;
  fechaCreacion: Date;
  tramos: TramoDto[];
  tiempoEstimadoTotal: number;
  distanciaTotal: number;
  envios: string[];
}

// Definición interna temporal de RutaPropuesta para uso en el servicio
interface RutaPropuesta {
  id?: string;
  equipoId: string;
  envios: Envio[];
  tramos: any[];
  tiempoEstimado: number;
  distanciaTotal: number;
  requiereModificacion?: boolean;
}

@injectable()
export class OptimizacionService implements IOptimizacionService {
  private readonly CACHE_TTL = 3600; // 1 hora en segundos
  private readonly TOPIC_RUTAS = 'rutas';

  constructor(
    @inject(TYPES.IEnvioRepository) private envioRepository: IEnvioRepository,
    @inject(TYPES.IEquipoRepository) private equipoRepository: IEquipoRepository,
    @inject(TYPES.IVehiculoRepository) private vehiculoRepository: IVehiculoRepository,
    @inject(TYPES.IRutaRepository) private rutaRepository: IRutaRepository,
    @inject(TYPES.IGpsRepository) private gpsRepository: IGpsRepository,
    @inject(TYPES.ISlaRepository) private slaRepository: ISlaRepository,
    @inject(TYPES.IEventoRepository) private eventoRepository: IEventoRepository,
    @inject(TYPES.IPubSubService) private pubSubService: IPubSubService,
    @inject(TYPES.ICacheService) private cacheService: ICacheService,
    // Inyectar las APIs externas
    @inject(TYPES.IGpsApi) private gpsApi: IGpsApi,
    @inject(TYPES.ITraficoClimaApi) private traficoClimaApi: ITraficoClimaApi,
    @inject(TYPES.IVehiculoApi) private vehiculoApi: IVehiculoApi
  ) {}

  async optimizarRuta(equipoId: string, fecha: Date): Promise<Ruta> {
    // Verificar si ya existe una ruta para este equipo y fecha
    const rutaExistente = await this.rutaRepository.findByEquipoYFecha(equipoId, fecha);
    
    if (rutaExistente) {
      throw new Error('Ya existe una ruta optimizada para este equipo en la fecha especificada');
    }

    // Obtener el equipo
    const equipo = await this.equipoRepository.findById(equipoId);
    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    // Obtener el vehículo asociado al equipo
    const vehiculo = await this.vehiculoRepository.findById(equipo.vehiculoId);
    if (!vehiculo) {
      throw new Error('Vehículo no encontrado');
    }

    // Verificar disponibilidad del vehículo usando la API externa
    const disponibilidadVehiculo = await this.vehiculoApi.verificarDisponibilidad(vehiculo.id);
    if (!disponibilidadVehiculo.disponible) {
      throw new Error(`El vehículo no está disponible: ${disponibilidadVehiculo.razon}`);
    }

    // Obtener capacidad actualizada del vehículo desde la API externa
    const capacidadVehiculo = await this.vehiculoApi.obtenerCapacidad(vehiculo.id);

    // Obtener los envíos pendientes para la ciudad del equipo
    const enviosPendientes = await this.envioRepository.findByCiudad(equipo.ciudadId);
    const enviosFiltrados = enviosPendientes.filter(e => 
      e.estado === EstadoEnvio.PENDIENTE && 
      !e.equipoId && 
      e.peso <= capacidadVehiculo.pesoMaximo && 
      e.volumen <= capacidadVehiculo.volumenMaximo
    );

    if (enviosFiltrados.length === 0) {
      throw new Error('No hay envíos pendientes para optimizar');
    }

    // Obtener los SLAs para priorizar los envíos
    const slas = await this.slaRepository.findAll();
    const slasMap = new Map<string, Sla>();
    slas.forEach(sla => slasMap.set(sla.id, sla));

    // Obtener condiciones de tráfico y clima para la ciudad
    const condicionesTrafico = await this.traficoClimaApi.obtenerCondicionesTrafico(equipo.ciudadId);
    const condicionesClima = await this.traficoClimaApi.obtenerCondicionesClima(equipo.ciudadId);

    // Ordenar envíos por prioridad de SLA, considerando también las condiciones de tráfico y clima
    const enviosConPrioridad = await Promise.all(enviosFiltrados.map(async envio => {
      // Obtener el impacto de la ruta para este envío
      const impactoRuta = await this.traficoClimaApi.obtenerImpactoRuta(
        { latitud: equipo.latitud, longitud: equipo.longitud },
        { latitud: envio.latitudDestino, longitud: envio.longitudDestino }
      );

      // Calcular puntaje final considerando SLA, impacto de tráfico y clima
      const prioridadSla = slasMap.get(envio.slaId)?.prioridad || 5;
      
      // Ajustar por tráfico y clima
      let factorAjuste = 1.0;
      
      // Ajuste por tráfico
      if (condicionesTrafico.nivel === NivelTrafico.ALTO) {
        factorAjuste *= 1.5;
      } else if (condicionesTrafico.nivel === NivelTrafico.MEDIO) {
        factorAjuste *= 1.2;
      }
      
      // Ajuste por impacto de ruta
      if (impactoRuta.nivelImpacto === NivelImpacto.ALTO) {
        factorAjuste *= 2.0;
      } else if (impactoRuta.nivelImpacto === NivelImpacto.MEDIO) {
        factorAjuste *= 1.3;
      }
      
      // Menor número = mayor prioridad
      const puntajeFinal = prioridadSla * factorAjuste;
      
      return {
        envio,
        prioridad: puntajeFinal
      };
    }));

    enviosConPrioridad.sort((a, b) => a.prioridad - b.prioridad);

    // Calcular la capacidad total del vehículo usando los datos de la API externa
    const capacidadPesoTotal = capacidadVehiculo.pesoMaximo;
    const capacidadVolumenTotal = capacidadVehiculo.volumenMaximo;

    // Seleccionar envíos hasta llenar el vehículo
    const enviosSeleccionados: Envio[] = [];
    let pesoActual = 0;
    let volumenActual = 0;

    for (const { envio } of enviosConPrioridad) {
      if (pesoActual + envio.peso <= capacidadPesoTotal && 
          volumenActual + envio.volumen <= capacidadVolumenTotal) {
        enviosSeleccionados.push(envio);
        pesoActual += envio.peso;
        volumenActual += envio.volumen;
      }
    }

    if (enviosSeleccionados.length === 0) {
      throw new Error('No hay envíos que puedan caber en el vehículo');
    }

    // Calcular distancia total y tiempo estimado considerando tráfico y clima
    let distanciaTotal = 0;
    let tiempoEstimado = 0;

    // Punto inicial (ubicación del equipo)
    let puntoActual = { latitud: equipo.latitud, longitud: equipo.longitud };

    // Calcular ruta para cada envío
    for (const envio of enviosSeleccionados) {
      const destino = { latitud: envio.latitudDestino, longitud: envio.longitudDestino };
      
      // Obtener impacto de la ruta
      const impacto = await this.traficoClimaApi.obtenerImpactoRuta(puntoActual, destino);
      
      // Calcular distancia euclídea (simplificado)
      const distanciaSegmento = Math.sqrt(
        Math.pow(puntoActual.latitud - destino.latitud, 2) +
        Math.pow(puntoActual.longitud - destino.longitud, 2)
      ) * 111.32; // Aproximación km (1 grado ≈ 111.32 km)
      
      // Ajustar por impacto
      let factorTiempo = 1.0;
      if (impacto.nivelImpacto === NivelImpacto.ALTO) {
        factorTiempo = 2.0;
      } else if (impacto.nivelImpacto === NivelImpacto.MEDIO) {
        factorTiempo = 1.5;
      }
      
      // Tiempo estimado: 2 minutos por km en condiciones normales, ajustado por impacto
      const tiempoSegmento = distanciaSegmento * 2 * factorTiempo;
      
      distanciaTotal += distanciaSegmento;
      tiempoEstimado += tiempoSegmento;
      
      // Actualizar punto actual para el siguiente cálculo
      puntoActual = destino;
    }

    // Redondear valores
    distanciaTotal = Math.round(distanciaTotal * 10) / 10; // 1 decimal
    tiempoEstimado = Math.round(tiempoEstimado); // minutos enteros

    // Crear la ruta optimizada
    const nuevaRuta: Ruta = new Ruta({
      id: uuidv4(),
      equipoId,
      fecha,
      envios: enviosSeleccionados.map(e => e.id),
      estado: EstadoRuta.PLANIFICADA,
      distanciaTotal,
      tiempoEstimado,
      replanificada: false,
      ultimoEventoId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Guardar la ruta en la base de datos
    const rutaCreada = await this.rutaRepository.create(nuevaRuta);

    // Actualizar los envíos
    for (let i = 0; i < enviosSeleccionados.length; i++) {
      const envio = enviosSeleccionados[i];
      await this.envioRepository.update(envio.id, {
        equipoId,
        estado: EstadoEnvio.ASIGNADO,
        ordenEntrega: i + 1,
        fechaEntregaEstimada: new Date(fecha.getTime() + tiempoEstimado * 60 * 1000) // Fecha actual + tiempo estimado
      });
    }

    // Notificar a través de PubSub
    await this.pubSubService.publicar(this.TOPIC_RUTAS, rutaCreada);

    return rutaCreada;
  }

  async replanificarRuta(equipoId: string, eventoId: string): Promise<Ruta | null> {
    // Verificar si el evento existe
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new Error('Evento no encontrado');
    }

    // Verificar si el evento está activo
    if (!evento.activo) {
      throw new Error('El evento ya no está activo');
    }

    // Verificar si se puede replanificar (solo una vez por evento)
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0); // Inicio del día actual
    
    const yaReplanificada = await this.rutaRepository.existeReplanificacionPrevia(equipoId, eventoId, fecha);
    if (yaReplanificada) {
      throw new Error('Esta ruta ya fue replanificada por este evento');
    }

    // Obtener la ruta actual
    const rutaActual = await this.rutaRepository.findByEquipoYFecha(equipoId, fecha);
    if (!rutaActual) {
      throw new Error('No hay una ruta para replanificar');
    }

    // Verificar que la ruta esté en progreso
    if (rutaActual.estado !== EstadoRuta.EN_PROGRESO) {
      throw new Error('Solo se pueden replanificar rutas en progreso');
    }

    // Obtener los envíos de la ruta
    const envios = await Promise.all(
      rutaActual.envios.map(id => this.envioRepository.findById(id))
    );

    // Filtrar envíos válidos (no nulos y no entregados)
    const enviosValidos = envios
      .filter((e): e is Envio => e !== null)
      .filter(e => e.estado !== EstadoEnvio.ENTREGADO && e.estado !== EstadoEnvio.CANCELADO);

    if (enviosValidos.length === 0) {
      throw new Error('No hay envíos pendientes para replanificar');
    }

    // Obtener el equipo para acceder a su ciudad
    const equipo = await this.equipoRepository.findById(equipoId);
    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    // Obtener la última ubicación GPS del equipo usando la API externa
    const ubicacionGps = await this.gpsApi.obtenerUbicacion(equipoId);
    if (!ubicacionGps) {
      throw new Error('No se encontró la ubicación actual del equipo');
    }

    // Obtener condiciones actualizadas de tráfico y clima
    const condicionesTrafico = await this.traficoClimaApi.obtenerCondicionesTrafico(equipo.ciudadId);
    const condicionesClima = await this.traficoClimaApi.obtenerCondicionesClima(equipo.ciudadId);

    // Obtenemos los SLAs para priorizar
    const slas = await this.slaRepository.findAll();
    const slasMap = new Map<string, Sla>();
    slas.forEach(sla => slasMap.set(sla.id, sla));

    // Reordenar los envíos considerando la ubicación actual, condiciones de tráfico/clima y SLA
    const enviosConPrioridad = await Promise.all(enviosValidos.map(async envio => {
      // Obtener impacto de la ruta desde la ubicación actual
      const impactoRuta = await this.traficoClimaApi.obtenerImpactoRuta(
        { latitud: ubicacionGps.latitud, longitud: ubicacionGps.longitud },
        { latitud: envio.latitudDestino, longitud: envio.longitudDestino }
      );
      
      // Calcular distancia desde la ubicación actual
      const distancia = Math.sqrt(
        Math.pow(ubicacionGps.latitud - envio.latitudDestino, 2) +
        Math.pow(ubicacionGps.longitud - envio.longitudDestino, 2)
      ) * 111.32; // Aproximación km
      
      // Obtener prioridad del SLA
      const prioridadSla = slasMap.get(envio.slaId)?.prioridad || 5;
      
      // Ajustar por tráfico y clima
      let factorAjuste = 1.0;
      
      // Ajuste por el impacto de la ruta
      if (impactoRuta.nivelImpacto === NivelImpacto.ALTO) {
        factorAjuste *= 2.0;
      } else if (impactoRuta.nivelImpacto === NivelImpacto.MEDIO) {
        factorAjuste *= 1.5;
      }
      
      // Ajuste por el evento que causó la replanificación
      if (evento.tipo === 'TRAFICO' || evento.tipo === 'CLIMA') {
        factorAjuste *= 1.3;
      }
      
      // Calcular puntaje considerando todos los factores
      // Menor puntaje = mayor prioridad
      const puntaje = (distancia * factorAjuste) * prioridadSla;
      
      return { envio, puntaje };
    }));

    // Ordenar por puntaje (menor primero)
    enviosConPrioridad.sort((a, b) => a.puntaje - b.puntaje);
    
    // Extraer solo los envíos ordenados
    const nuevosEnviosOrdenados = enviosConPrioridad.map(item => item.envio);

    // Actualizar el orden de entrega de los envíos
    for (let i = 0; i < nuevosEnviosOrdenados.length; i++) {
      await this.envioRepository.actualizarOrdenEntrega(nuevosEnviosOrdenados[i].id, i + 1);
    }

    // Calcular nueva distancia total y tiempo estimado considerando el tráfico y clima
    let nuevaDistanciaTotal = 0;
    let nuevoTiempoEstimado = 0;

    // Punto inicial (ubicación actual del equipo)
    let puntoActual = { latitud: ubicacionGps.latitud, longitud: ubicacionGps.longitud };

    // Calcular ruta para cada envío
    for (const envio of nuevosEnviosOrdenados) {
      const destino = { latitud: envio.latitudDestino, longitud: envio.longitudDestino };
      
      // Obtener impacto de la ruta
      const impacto = await this.traficoClimaApi.obtenerImpactoRuta(puntoActual, destino);
      
      // Calcular distancia euclídea (simplificado)
      const distanciaSegmento = Math.sqrt(
        Math.pow(puntoActual.latitud - destino.latitud, 2) +
        Math.pow(puntoActual.longitud - destino.longitud, 2)
      ) * 111.32; // Aproximación km
      
      // Ajustar por impacto
      let factorTiempo = 1.0;
      if (impacto.nivelImpacto === NivelImpacto.ALTO) {
        factorTiempo = 2.0;
      } else if (impacto.nivelImpacto === NivelImpacto.MEDIO) {
        factorTiempo = 1.5;
      }
      
      // Tiempo estimado: 2 minutos por km en condiciones normales, ajustado por impacto
      const tiempoSegmento = distanciaSegmento * 2 * factorTiempo;
      
      nuevaDistanciaTotal += distanciaSegmento;
      nuevoTiempoEstimado += tiempoSegmento;
      
      // Actualizar punto actual para el siguiente cálculo
      puntoActual = destino;
    }

    // Redondear valores
    nuevaDistanciaTotal = Math.round(nuevaDistanciaTotal * 10) / 10; // 1 decimal
    nuevoTiempoEstimado = Math.round(nuevoTiempoEstimado); // minutos enteros

    // Actualizar la ruta
    const rutaActualizada = await this.rutaRepository.update(rutaActual.id, {
      envios: nuevosEnviosOrdenados.map(e => e.id),
      distanciaTotal: nuevaDistanciaTotal,
      tiempoEstimado: nuevoTiempoEstimado,
      replanificada: true,
      ultimoEventoId: eventoId,
      updatedAt: new Date()
    });

    // Registrar la ubicación actual del equipo
    await this.gpsApi.registrarUbicacion({
      equipoId,
      latitud: ubicacionGps.latitud,
      longitud: ubicacionGps.longitud,
      velocidad: ubicacionGps.velocidad,
      timestamp: new Date()
    });

    // Notificar a través de PubSub
    await this.pubSubService.publicar(`${this.TOPIC_RUTAS}:replanificada`, rutaActualizada);

    return rutaActualizada;
  }

  async validarReplanificacion(equipoId: string, eventoId: string): Promise<boolean> {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0); // Inicio del día actual
    
    return !(await this.rutaRepository.existeReplanificacionPrevia(equipoId, eventoId, fecha));
  }

  private calcularImpactoTotal(impactos: ImpactoRuta[]): number {
    // Valores de peso para cada nivel de impacto
    const pesos = {
      BAJO: 1,
      MEDIO: 2,
      ALTO: 3,
      CRITICO: 4
    };

    // Calcular suma ponderada de los impactos
    let impactoTotal = 0;
    for (const impacto of impactos) {
      impactoTotal += pesos[impacto.nivelImpacto];
    }

    return impactoTotal;
  }

  private async evaluarRutasAfectadas(
    rutasPropuestas: RutaPropuesta[],
    eventos: Evento[]
  ): Promise<RutaPropuesta[]> {
    // Si no hay eventos activos, devolver las rutas sin cambios
    if (eventos.length === 0) {
      return rutasPropuestas;
    }

    // Evaluar cada ruta para determinar si debe modificarse
    const rutasEvaluadas: RutaPropuesta[] = [];

    for (const ruta of rutasPropuestas) {
      let debeModificarse = false;

      // Verificar todos los tramos de la ruta
      for (const tramo of ruta.tramos) {
        // Verificar si hay eventos que afecten este tramo
        for (const evento of eventos) {
          // Si el evento afecta a esta ciudad y es de alto impacto
          if (evento.ciudadId === tramo.ciudadId) {
            // Obtener impacto específico para este tramo
            const impactoRuta = await this.traficoClimaApi.obtenerImpactoRuta(
              { latitud: tramo.latitudOrigen, longitud: tramo.longitudOrigen },
              { latitud: tramo.latitudDestino, longitud: tramo.longitudDestino }
            );

            // Si el impacto es ALTO o CRITICO, modificar la ruta
            if (impactoRuta.nivelImpacto === 'ALTO' || impactoRuta.nivelImpacto === 'CRITICO') {
              debeModificarse = true;
              break;
            }
          }
        }
        if (debeModificarse) break;
      }

      // Añadir la ruta a la lista de evaluadas
      if (debeModificarse) {
        // Marcar para modificación posterior
        ruta.requiereModificacion = true;
      }
      rutasEvaluadas.push(ruta);
    }

    return rutasEvaluadas;
  }

  private async registrarUbicacionEquipo(
    equipo: Equipo,
    coordenadas: Coordenadas
  ): Promise<void> {
    await this.gpsApi.registrarUbicacion({
      equipoId: equipo.id,
      latitud: coordenadas.latitud,
      longitud: coordenadas.longitud,
      timestamp: new Date(),
      velocidad: 40 // Velocidad simulada en km/h
    });
  }
} 
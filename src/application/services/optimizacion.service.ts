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
    @inject(TYPES.ICacheService) private cacheService: ICacheService
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

    // Obtener los envíos pendientes para la ciudad del equipo
    const enviosPendientes = await this.envioRepository.findByCiudad(equipo.ciudadId);
    const enviosFiltrados = enviosPendientes.filter(e => 
      e.estado === EstadoEnvio.PENDIENTE && 
      !e.equipoId && 
      e.peso <= vehiculo.capacidadPeso && 
      e.volumen <= vehiculo.capacidadVolumen
    );

    if (enviosFiltrados.length === 0) {
      throw new Error('No hay envíos pendientes para optimizar');
    }

    // Obtener los SLAs para priorizar los envíos
    const slas = await this.slaRepository.findAll();
    const slasMap = new Map<string, Sla>();
    slas.forEach(sla => slasMap.set(sla.id, sla));

    // Ordenar envíos por prioridad de SLA (menor número es mayor prioridad)
    const enviosConPrioridad = enviosFiltrados.map(envio => ({
      envio,
      prioridad: slasMap.get(envio.slaId)?.prioridad || 5
    }));

    enviosConPrioridad.sort((a, b) => a.prioridad - b.prioridad);

    // Calcular la capacidad total del vehículo
    const capacidadPesoTotal = vehiculo.capacidadPeso;
    const capacidadVolumenTotal = vehiculo.capacidadVolumen;

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

    // Calcular distancia total y tiempo estimado (simplificado para esta demo)
    // En un sistema real, esto usaría un algoritmo de ruteo más sofisticado
    const distanciaTotal = enviosSeleccionados.length * 5; // 5 km por envío en promedio
    const tiempoEstimado = enviosSeleccionados.length * 20; // 20 minutos por envío en promedio

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
        fechaEntregaEstimada: new Date(fecha.getTime() + (i + 1) * 20 * 60 * 1000) // Fecha actual + tiempo estimado
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

    // Obtener la última ubicación GPS del equipo
    const ultimaUbicacion = await this.gpsRepository.findUltimaUbicacion(equipoId);
    if (!ultimaUbicacion) {
      throw new Error('No se encontró la ubicación actual del equipo');
    }

    // Obtenemos los SLAs para priorizar
    const slas = await this.slaRepository.findAll();
    const slasMap = new Map<string, Sla>();
    slas.forEach(sla => slasMap.set(sla.id, sla));

    // Reordenar los envíos considerando la ubicación actual, el impacto del evento y la prioridad SLA
    const enviosConPrioridad = enviosValidos.map(envio => {
      // Calcular distancia desde la ubicación actual (fórmula simplificada)
      const distancia = Math.sqrt(
        Math.pow(ultimaUbicacion.latitud - envio.latitudDestino, 2) +
        Math.pow(ultimaUbicacion.longitud - envio.longitudDestino, 2)
      );
      
      // Obtener prioridad del SLA
      const prioridad = slasMap.get(envio.slaId)?.prioridad || 5;
      
      // Calcular puntaje considerando distancia y prioridad SLA
      // Menor puntaje = mayor prioridad
      const puntaje = distancia * prioridad;
      
      return { envio, puntaje };
    });

    // Ordenar por puntaje (menor primero)
    enviosConPrioridad.sort((a, b) => a.puntaje - b.puntaje);
    
    // Extraer solo los envíos ordenados
    const nuevosEnviosOrdenados = enviosConPrioridad.map(item => item.envio);

    // Actualizar el orden de entrega de los envíos
    for (let i = 0; i < nuevosEnviosOrdenados.length; i++) {
      await this.envioRepository.actualizarOrdenEntrega(nuevosEnviosOrdenados[i].id, i + 1);
    }

    // Calcular nueva distancia total y tiempo estimado
    const nuevaDistanciaTotal = nuevosEnviosOrdenados.length * 5; // Simplificado
    const nuevoTiempoEstimado = nuevosEnviosOrdenados.length * 20; // Simplificado

    // Actualizar la ruta
    const rutaActualizada = await this.rutaRepository.update(rutaActual.id, {
      envios: nuevosEnviosOrdenados.map(e => e.id),
      distanciaTotal: nuevaDistanciaTotal,
      tiempoEstimado: nuevoTiempoEstimado,
      replanificada: true,
      ultimoEventoId: eventoId,
      updatedAt: new Date()
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
} 
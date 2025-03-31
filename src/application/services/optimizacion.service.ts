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
  IVehiculoApi,
  NivelTrafico,
  NivelImpacto,
  ImpactoRuta,
  Coordenadas,
  EstadoClima
} from '../../domain/interfaces/external-apis.interface';
import { Equipo } from '../../domain/entities/equipo.entity';
import { Evento, TipoEvento } from '../../domain/entities/evento.entity';
import { OptimizarRutaRequestDto } from '../dtos/ruta.dto';
import { IDatabase } from '../../infrastructure/database/database';
import {
  TramoDto,
  OptimizarRutaResponseDto,
  EnvioOptimizacionDto,
  ResultadoOptimizacion,
  ResultadoOptimizacionMasiva,
  RutaPropuesta
} from '../dtos/optimizacion.dto';
import { ITraficoClimaService } from '../interfaces/trafico-clima-service.interface';

@injectable()
export class OptimizacionService implements IOptimizacionService {
  private readonly CACHE_TTL = 3600; // 1 hora en segundos
  private readonly TOPIC_RUTAS = 'rutas';

  constructor(
    @inject(TYPES.IRutaRepository) private rutaRepository: IRutaRepository,
    @inject(TYPES.IEquipoRepository) private equipoRepository: IEquipoRepository,
    @inject(TYPES.IEnvioRepository) private envioRepository: IEnvioRepository,
    @inject(TYPES.IVehiculoRepository) private vehiculoRepository: IVehiculoRepository,
    @inject(TYPES.IEventoRepository) private eventoRepository: IEventoRepository,
    @inject(TYPES.ISlaRepository) private slaRepository: ISlaRepository,
    @inject(TYPES.IPubSubService) private pubSubService: IPubSubService,
    @inject(TYPES.ITraficoClimaService) private traficoClimaService: ITraficoClimaService,
    @inject(TYPES.IVehiculoApi) private vehiculoApi: IVehiculoApi,
    @inject(TYPES.IDatabase) private db: IDatabase
  ) {}

  // Método para obtener la ubicación actual de un equipo
  private async obtenerUbicacionEquipo(equipoId: string): Promise<{ latitud: number; longitud: number }> {
    try {
      // Obtener la ubicación desde la tabla normalizada
      const query = `
        SELECT latitud, longitud 
        FROM equipos_ubicacion_actual 
        WHERE equipo_id = $1
      `;
      
      const result = await this.db.query<{ latitud: number; longitud: number }>(query, [equipoId]);
      
      if (result.length > 0) {
        console.log(`Ubicación obtenida de equipos_ubicacion_actual para equipo ${equipoId}:`, result[0]);
        return result[0];
      }
      
      // Si no se encuentra ubicación, usar coordenadas por defecto
      console.log(`No se encontró ubicación para equipo ${equipoId}. Usando coordenadas por defecto`);
      
      // Coordenadas predeterminadas según el equipo
      const coordenadasPredeterminadas: Record<string, { latitud: number; longitud: number }> = {
        'equipo-001': { latitud: 4.65, longitud: -74.05 },
        'equipo-002': { latitud: 4.61, longitud: -74.08 },
        'equipo-003': { latitud: 4.70, longitud: -74.04 },
        'equipo-004': { latitud: 4.67, longitud: -74.07 },
        'default': { latitud: 4.63, longitud: -74.06 }
      };
      
      return coordenadasPredeterminadas[equipoId] || coordenadasPredeterminadas['default'];
    } catch (error) {
      console.error(`Error al obtener ubicación del equipo ${equipoId}:`, error);
      return { latitud: 4.65, longitud: -74.05 }; // Coordenadas por defecto
    }
  }

  /**
   * Optimiza la ruta para un equipo específico en una fecha determinada
   * @param equipoId ID del equipo
   * @param fecha Fecha para planificar la ruta
   * @returns La ruta optimizada
   */
  async optimizarRuta(equipoId: string, fecha: Date): Promise<Ruta> {
    // Verificar si ya existe una ruta para este equipo y fecha
    const rutaExistente = await this.rutaRepository.findByEquipoYFecha(equipoId, fecha);
    
    if (rutaExistente) {
      throw new Error('Ya existe una ruta optimizada para este equipo en la fecha especificada');
    }

    console.log('Buscando equipo con ID:', equipoId);
    // Obtener el equipo
    const equipo = await this.equipoRepository.findById(equipoId);
    console.log('Equipo encontrado:', equipo);
    
    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    // Obtener la ubicación actual del equipo
    const ubicacionEquipo = await this.obtenerUbicacionEquipo(equipoId);
    console.log(`Ubicación del equipo ${equipoId}:`, ubicacionEquipo);

    console.log('Buscando vehículo con ID:', equipo.vehiculoId);
    // Obtener el vehículo asociado al equipo
    const vehiculo = await this.vehiculoRepository.findById(equipo.vehiculoId);
    console.log('Vehículo encontrado:', vehiculo);
    
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
    
    // Filtrar los envíos que:
    // 1. Estén pendientes (no asignados a otro equipo)
    // 2. No tengan asignación previa
    // 3. Sean compatibles con la capacidad del vehículo (peso y volumen)
    const enviosFiltrados = enviosPendientes.filter(e => 
      e.estado === EstadoEnvio.PENDIENTE && 
      !e.equipoId && 
      e.peso <= capacidadVehiculo.pesoMaximo && 
      e.volumen <= capacidadVehiculo.volumenMaximo
    );

    if (enviosFiltrados.length === 0) {
      throw new Error('No hay envíos pendientes que cumplan los requisitos para optimizar');
    }

    // Ejecutar algoritmo de optimización
    const resultado = await this.optimizarCargaYRuta(
      enviosFiltrados, 
      ubicacionEquipo, 
      capacidadVehiculo, 
      equipo
    );
    
    if (resultado.enviosOrdenados.length === 0) {
      throw new Error('No se pudo generar una ruta óptima con los envíos disponibles');
    }

    // Crear la ruta optimizada
    const nuevaRuta: Ruta = new Ruta({
      id: uuidv4(),
      equipoId,
      fecha,
      envios: resultado.enviosOrdenados.map(e => e.id),
      estado: EstadoRuta.PLANIFICADA,
      distanciaTotal: resultado.distanciaTotal,
      tiempoEstimado: resultado.tiempoEstimado,
      replanificada: false,
      ultimoEventoId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Guardar la ruta en la base de datos
    const rutaCreada = await this.rutaRepository.create(nuevaRuta);

    // Actualizar los envíos con su orden de entrega y equipo asignado
    await Promise.all(resultado.enviosOrdenados.map(async (envio, index) => {
      await this.envioRepository.update(envio.id, {
        equipoId,
        estado: EstadoEnvio.ASIGNADO,
        ordenEntrega: index + 1,
        fechaEntregaEstimada: new Date(fecha.getTime() + resultado.tiempoEstimado * 60 * 1000)
      });
    }));

    // Notificar a través de PubSub
    await this.pubSubService.publicar(this.TOPIC_RUTAS, rutaCreada);

    return rutaCreada;
  }

  /**
   * Optimiza la carga del vehículo y la ruta de entrega
   * Implementa un algoritmo que considera:
   * 1. Capacidad del vehículo (peso y volumen máximos)
   * 2. Prioridad de los envíos según SLA
   * 3. Condiciones de tráfico y clima
   * 4. Optimización de la ruta para minimizar distancia
   */
  private async optimizarCargaYRuta(
    enviosDisponibles: Envio[],
    ubicacionInicial: { latitud: number; longitud: number },
    capacidadVehiculo: { pesoMaximo: number; volumenMaximo: number },
    equipo: Equipo
  ): Promise<ResultadoOptimizacion> {
    // Obtener los SLAs para priorizar los envíos
    const slas = await this.slaRepository.findAll();
    const slasMap = new Map<string, Sla>();
    slas.forEach(sla => slasMap.set(sla.id, sla));

    // Obtener condiciones de tráfico y clima para la ciudad utilizando el servicio
    const condicionesTrafico = await this.traficoClimaService.obtenerCondicionesTrafico(equipo.ciudadId);
    const condicionesClima = await this.traficoClimaService.obtenerCondicionesClima(equipo.ciudadId);

    // Obtener la evaluación general de las condiciones
    const evaluacionCondiciones = await this.traficoClimaService.evaluarCondicionesGenerales(equipo.ciudadId);

    // Calcular puntaje para cada envío basado en SLA, distancia y condiciones
    const enviosConPuntaje: EnvioOptimizacionDto[] = await Promise.all(enviosDisponibles.map(async envio => {
      // Obtener el impacto de la ruta para este envío usando el servicio
      const impactoRuta = await this.traficoClimaService.calcularImpactoRuta(
        ubicacionInicial,
        { latitud: envio.latitudDestino, longitud: envio.longitudDestino }
      );

      // Calcular distancia directa desde la ubicación inicial
      const distancia = Math.sqrt(
        Math.pow(ubicacionInicial.latitud - envio.latitudDestino, 2) +
        Math.pow(ubicacionInicial.longitud - envio.longitudDestino, 2)
      ) * 111.32; // Aproximación km

      // Obtener prioridad del SLA (menor número = mayor prioridad)
      const prioridadSla = slasMap.get(envio.slaId)?.prioridad || 5;
      
      // Usar el factor global calculado por el servicio
      const factorAjuste = evaluacionCondiciones.factorDelay;
      
      // Fórmula de priorización: 
      // - Menor SLA (más urgente) tiene más prioridad
      // - Mayor distancia tiene menos prioridad (para favorecer envíos cercanos)
      // - Factores de ajuste por condiciones
      const puntaje = (prioridadSla * 100) - (50 / (distancia * factorAjuste));
      
      return {
        envio,
        distancia,
        puntaje,
        impacto: impactoRuta.nivelImpacto
      };
    }));

    // Primera fase: Selección de envíos según capacidad y prioridad
    // Ordenar por puntaje (menor es mejor - más prioritario)
    enviosConPuntaje.sort((a, b) => a.puntaje - b.puntaje);
    
    // Seleccionar envíos hasta llenar el vehículo
    const enviosSeleccionados: EnvioOptimizacionDto[] = [];
    let pesoActual = 0;
    let volumenActual = 0;
    
    for (const item of enviosConPuntaje) {
      if (pesoActual + item.envio.peso <= capacidadVehiculo.pesoMaximo && 
          volumenActual + item.envio.volumen <= capacidadVehiculo.volumenMaximo) {
        enviosSeleccionados.push(item);
        pesoActual += item.envio.peso;
        volumenActual += item.envio.volumen;
      }
    }
    
    if (enviosSeleccionados.length === 0) {
      return { enviosOrdenados: [], distanciaTotal: 0, tiempoEstimado: 0 };
    }
    
    // Segunda fase: Optimización de ruta con algoritmo de vecino más cercano
    const rutaOptimizada = this.optimizarOrdenEntrega(enviosSeleccionados, ubicacionInicial);
    
    // Calcular distancia total y tiempo estimado
    let distanciaTotal = 0;
    let tiempoEstimado = 0;
    let puntoActual = ubicacionInicial;
    
    // Recalcular la ruta completa con tiempos ajustados por condiciones
    for (const envio of rutaOptimizada) {
      const destino = { latitud: envio.envio.latitudDestino, longitud: envio.envio.longitudDestino };
      
      // Calcular distancia directa
      const distanciaSegmento = Math.sqrt(
        Math.pow(puntoActual.latitud - destino.latitud, 2) +
        Math.pow(puntoActual.longitud - destino.longitud, 2)
      ) * 111.32; // Aproximación km
      
      // Usar el factor de retraso global para ajustar el tiempo
      const factorTiempo = envio.impacto === NivelImpacto.ALTO ? 
        evaluacionCondiciones.factorDelay * 1.5 : 
        envio.impacto === NivelImpacto.MEDIO ? 
          evaluacionCondiciones.factorDelay * 1.2 : 
          evaluacionCondiciones.factorDelay;
      
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
    
    // Extraer solo los envíos ordenados
    const enviosOrdenados = rutaOptimizada.map(item => item.envio);
    
    return {
      enviosOrdenados,
      distanciaTotal,
      tiempoEstimado
    };
  }
  
  /**
   * Implementa el algoritmo del vecino más cercano para optimizar el orden de entrega
   * @returns Lista de envíos ordenados por ruta óptima
   */
  private optimizarOrdenEntrega(
    envios: EnvioOptimizacionDto[],
    ubicacionInicial: { latitud: number; longitud: number }
  ): EnvioOptimizacionDto[] {
    if (envios.length <= 1) return envios;
    
    const resultado: EnvioOptimizacionDto[] = [];
    const pendientes = [...envios];
    let ubicacionActual = ubicacionInicial;
    
    // Mientras queden envíos por procesar
    while (pendientes.length > 0) {
      // Encontrar el envío más cercano a la ubicación actual
      let indiceMasCercano = -1;
      let distanciaMinima = Infinity;
      
      for (let i = 0; i < pendientes.length; i++) {
        const envio = pendientes[i].envio;
        const distancia = Math.sqrt(
          Math.pow(ubicacionActual.latitud - envio.latitudDestino, 2) +
          Math.pow(ubicacionActual.longitud - envio.longitudDestino, 2)
        ) * 111.32; // Aproximación km
        
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          indiceMasCercano = i;
        }
      }
      
      // Añadir el envío más cercano a la ruta
      const siguiente = pendientes.splice(indiceMasCercano, 1)[0];
      resultado.push(siguiente);
      
      // Actualizar la ubicación actual
      ubicacionActual = {
        latitud: siguiente.envio.latitudDestino,
        longitud: siguiente.envio.longitudDestino
      };
    }
    
    return resultado;
  }

  /**
   * Optimiza rutas para todos los equipos disponibles en una ciudad
   * @param ciudadId ID de la ciudad para optimizar
   * @param fecha Fecha para la planificación
   * @returns Resultado de la optimización masiva
   */
  async optimizarRutasMasivas(ciudadId: string, fecha: Date): Promise<ResultadoOptimizacionMasiva> {
    // Obtener todos los equipos disponibles en la ciudad
    const equiposEnCiudad = await this.equipoRepository.findByCiudad(ciudadId);
    const equiposDisponibles = equiposEnCiudad.filter(e => e.disponible);
    
    if (equiposDisponibles.length === 0) {
      throw new Error(`No hay equipos disponibles en la ciudad ${ciudadId}`);
    }
    
    // Obtener todos los envíos pendientes en la ciudad
    const enviosPendientes = await this.envioRepository.findByCiudad(ciudadId);
    const enviosSinAsignar = enviosPendientes.filter(e => 
      e.estado === EstadoEnvio.PENDIENTE && !e.equipoId
    );
    
    if (enviosSinAsignar.length === 0) {
      throw new Error(`No hay envíos pendientes sin asignar en la ciudad ${ciudadId}`);
    }
    
    // Resultados de la optimización
    const rutasCreadas: Ruta[] = [];
    let enviosAsignados = 0;
    
    // Procesar cada equipo disponible
    for (const equipo of equiposDisponibles) {
      try {
        // Verificar si ya tiene una ruta asignada para esa fecha
        const rutaExistente = await this.rutaRepository.findByEquipoYFecha(equipo.id, fecha);
        if (rutaExistente) {
          console.log(`El equipo ${equipo.id} ya tiene una ruta asignada para la fecha ${fecha}`);
          continue;
        }
        
        // Optimizar ruta para este equipo
        const ruta = await this.optimizarRuta(equipo.id, fecha);
        rutasCreadas.push(ruta);
        enviosAsignados += ruta.envios.length;
        
        // Si ya no quedan envíos por asignar, terminamos
        if (enviosAsignados >= enviosSinAsignar.length) {
          break;
        }
      } catch (error) {
        console.error(`Error al optimizar ruta para equipo ${equipo.id}:`, error);
        // Continuamos con el siguiente equipo
      }
    }
    
    return {
      rutasCreadas,
      enviosAsignados,
      equiposOptimizados: rutasCreadas.length
    };
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
    if (rutaActual.estado !== EstadoRuta.EN_PROGRESO && rutaActual.estado !== EstadoRuta.PLANIFICADA) {
      throw new Error('Solo se pueden replanificar rutas en progreso o planificadas');
    }

    // Obtener el equipo
    const equipo = await this.equipoRepository.findById(equipoId);
    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    // Obtener la ubicación actual del equipo
    const ubicacionEquipo = await this.obtenerUbicacionEquipo(equipoId);

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

    // Obtener condiciones actualizadas utilizando el servicio
    const condicionesTrafico = await this.traficoClimaService.obtenerCondicionesTrafico(equipo.ciudadId);
    const condicionesClima = await this.traficoClimaService.obtenerCondicionesClima(equipo.ciudadId);
    const evaluacionCondiciones = await this.traficoClimaService.evaluarCondicionesGenerales(equipo.ciudadId);

    // Obtener los SLAs para priorización
    const slas = await this.slaRepository.findAll();
    const slasMap = new Map<string, Sla>();
    slas.forEach(sla => slasMap.set(sla.id, sla));

    // Preparar los envíos con su información para replanificar
    const enviosConInfo: EnvioOptimizacionDto[] = await Promise.all(enviosValidos.map(async envio => {
      // Obtener impacto de la ruta desde la ubicación actual
      const impactoRuta = await this.traficoClimaService.calcularImpactoRuta(
        ubicacionEquipo,
        { latitud: envio.latitudDestino, longitud: envio.longitudDestino }
      );
      
      // Calcular distancia desde la ubicación actual
      const distancia = Math.sqrt(
        Math.pow(ubicacionEquipo.latitud - envio.latitudDestino, 2) +
        Math.pow(ubicacionEquipo.longitud - envio.longitudDestino, 2)
      ) * 111.32; // Aproximación km
      
      // Obtener prioridad del SLA
      const prioridadSla = slasMap.get(envio.slaId)?.prioridad || 5;
      
      // Calcular puntaje
      let factorAjuste = 1.0;
      
      // Ajuste por impacto de ruta
      if (impactoRuta.nivelImpacto === NivelImpacto.ALTO) {
        factorAjuste *= 2.0;
      } else if (impactoRuta.nivelImpacto === NivelImpacto.MEDIO) {
        factorAjuste *= 1.5;
      }
      
      // Ajuste por clima
      if (condicionesClima.estado === EstadoClima.TORMENTA) {
        factorAjuste *= 1.5;
      } else if (condicionesClima.estado === EstadoClima.LLUVIOSO) {
        factorAjuste *= 1.3;
      }
      
      // Ajuste por tipo de evento
      if (evento.tipo === TipoEvento.TRAFICO || evento.tipo === TipoEvento.CLIMA) {
        factorAjuste *= 1.3;
      }
      
      // Fórmula para definir prioridad (menor = más prioritario)
      const puntaje = (distancia * factorAjuste) * prioridadSla;
      
      return { 
        envio, 
        distancia, 
        puntaje,
        impacto: impactoRuta.nivelImpacto 
      };
    }));

    // Aplicar algoritmo de replanificación similar al de optimización inicial
    const rutaReplanificada = this.optimizarOrdenEntrega(enviosConInfo, ubicacionEquipo);
    
    // Calcular nueva distancia total y tiempo estimado
    let nuevaDistanciaTotal = 0;
    let nuevoTiempoEstimado = 0;
    let puntoActual = ubicacionEquipo;

    // Recalcular para la nueva ruta
    for (const item of rutaReplanificada) {
      const destino = { latitud: item.envio.latitudDestino, longitud: item.envio.longitudDestino };
      
      // Calcular distancia directa
      const distanciaSegmento = Math.sqrt(
        Math.pow(puntoActual.latitud - destino.latitud, 2) +
        Math.pow(puntoActual.longitud - destino.longitud, 2)
      ) * 111.32; // Aproximación km
      
      // Ajuste por impacto
      let factorTiempo = 1.0;
      if (item.impacto === NivelImpacto.ALTO) {
        factorTiempo = 2.0;
      } else if (item.impacto === NivelImpacto.MEDIO) {
        factorTiempo = 1.5;
      }
      
      // Ajuste por clima
      if (condicionesClima.estado === EstadoClima.TORMENTA) {
        factorTiempo *= 1.5;
      } else if (condicionesClima.estado === EstadoClima.LLUVIOSO) {
        factorTiempo *= 1.3;
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

    // Extraer solo los envíos ordenados
    const nuevosEnviosOrdenados = rutaReplanificada.map(item => item.envio);
    
    // Actualizar el orden de entrega de los envíos
    for (let i = 0; i < nuevosEnviosOrdenados.length; i++) {
      await this.envioRepository.actualizarOrdenEntrega(nuevosEnviosOrdenados[i].id, i + 1);
    }

    // Actualizar la ruta
    const rutaActualizada = await this.rutaRepository.update(rutaActual.id, {
      envios: nuevosEnviosOrdenados.map(e => e.id),
      distanciaTotal: nuevaDistanciaTotal,
      tiempoEstimado: nuevoTiempoEstimado,
      replanificada: true,
      ultimoEventoId: eventoId,
      updatedAt: new Date()
    });

    // Registrar la ubicación actual del equipo en la tabla equipos_ubicacion_actual
    const upsertQuery = `
      INSERT INTO equipos_ubicacion_actual (
        equipo_id, latitud, longitud, velocidad, timestamp, updated_at
      ) VALUES (
        $1, $2, $3, $4, NOW(), NOW()
      )
      ON CONFLICT (equipo_id) 
      DO UPDATE SET 
        latitud = $2,
        longitud = $3,
        velocidad = $4,
        timestamp = NOW(),
        updated_at = NOW()
    `;
    
    await this.db.execute(upsertQuery, [
      equipoId,
      ubicacionEquipo.latitud,
      ubicacionEquipo.longitud,
      40 // Velocidad simulada en km/h
    ]);

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
            // Obtener impacto específico para este tramo usando el servicio
            const impactoRuta = await this.traficoClimaService.calcularImpactoRuta(
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
    const upsertQuery = `
      INSERT INTO equipos_ubicacion_actual (
        equipo_id, latitud, longitud, velocidad, timestamp, updated_at
      ) VALUES (
        $1, $2, $3, $4, NOW(), NOW()
      )
      ON CONFLICT (equipo_id) 
      DO UPDATE SET 
        latitud = $2,
        longitud = $3,
        velocidad = $4,
        timestamp = NOW(),
        updated_at = NOW()
    `;
    
    await this.db.execute(upsertQuery, [
      equipo.id,
      coordenadas.latitud,
      coordenadas.longitud,
      40 // Velocidad simulada en km/h
    ]);
  }
} 
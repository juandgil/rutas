import { Ruta } from '../../domain/entities/ruta.entity';
import { ResultadoOptimizacionMasiva } from '../dtos/optimizacion.dto';

/**
 * Interfaz del servicio de optimización de rutas
 */
export interface IOptimizacionService {
  /**
   * Optimiza la ruta para un equipo específico en una fecha determinada
   * @param equipoId ID del equipo
   * @param fecha Fecha para planificar la ruta
   */
  optimizarRuta(equipoId: string, fecha: Date): Promise<Ruta>;
  
  /**
   * Optimiza rutas para todos los equipos disponibles en una ciudad
   * @param ciudadId ID de la ciudad para optimizar
   * @param fecha Fecha para la planificación
   */
  optimizarRutasMasivas(ciudadId: string, fecha: Date): Promise<ResultadoOptimizacionMasiva>;
  
  /**
   * Replanifica una ruta existente basado en un evento
   * @param equipoId ID del equipo
   * @param eventoId ID del evento que causa la replanificación
   */
  replanificarRuta(equipoId: string, eventoId: string): Promise<Ruta | null>;
  
  /**
   * Valida si una ruta puede ser replanificada (no ha sido replanificada antes por el mismo evento)
   * @param equipoId ID del equipo
   * @param eventoId ID del evento
   */
  validarReplanificacion(equipoId: string, eventoId: string): Promise<boolean>;
} 
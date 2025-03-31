import { injectable } from 'inversify';
import { IGpsApi, GpsUbicacion } from '../../domain/interfaces/external-apis.interface';
import { ICacheService } from '../cache/redis-client';
import { inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { IDatabase } from '../database/database';

/**
 * Implementación simulada de la API de GPS para transportistas
 * que ahora consulta directamente la base de datos
 */
@injectable()
export class GpsApiMock implements IGpsApi {
  private readonly CACHE_KEY_PREFIX = 'gps:ubicacion:';
  private readonly CACHE_TTL = 120; // 2 minutos en segundos (la posición GPS cambia rápidamente)

  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService,
    @inject(TYPES.IDatabase) private db: IDatabase
  ) {}

  async obtenerUbicacion(equipoId: string): Promise<GpsUbicacion> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_PREFIX}${equipoId}`;
      const cachedData = await this.cacheService.get<GpsUbicacion>(cacheKey);
      
      if (cachedData) {
        console.log(`[GpsAPI] Ubicación obtenida de caché para equipo ${equipoId}`);
        return cachedData;
      }
      
      // Consultar directamente la tabla equipos_ubicacion_actual
      console.log(`[GpsAPI] Consultando base de datos para ubicación de equipo ${equipoId}`);
      const query = `
        SELECT equipo_id as "equipoId", latitud, longitud, velocidad, timestamp
        FROM equipos_ubicacion_actual
        WHERE equipo_id = $1
      `;
      
      const result = await this.db.query<GpsUbicacion>(query, [equipoId]);
      
      if (result.length === 0) {
        // Si no hay ubicación registrada, generar una por defecto
        return this.generarUbicacionPorDefecto(equipoId);
      }
      
      const ubicacion = result[0];
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, ubicacion, this.CACHE_TTL);
      console.log(`[GpsAPI] Guardada ubicación en caché para equipo ${equipoId}`);
      
      return ubicacion;
    } catch (error) {
      console.error(`[GpsAPI] Error al obtener ubicación GPS para equipo ${equipoId}:`, error);
      // En caso de error, generar una ubicación por defecto
      return this.generarUbicacionPorDefecto(equipoId);
    }
  }

  async obtenerHistorico(equipoId: string, desde: Date, hasta: Date): Promise<GpsUbicacion[]> {
    try {
      console.log(`[GpsAPI] Consultando base de datos para historial GPS de equipo ${equipoId}`);
      
      // Consultar directamente la tabla gps_registros
      const query = `
        SELECT equipo_id as "equipoId", latitud, longitud, velocidad, timestamp
        FROM gps_registros
        WHERE equipo_id = $1 AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp ASC
        LIMIT 1000
      `;
      
      const result = await this.db.query<GpsUbicacion>(query, [equipoId, desde, hasta]);
      
      return result;
    } catch (error) {
      console.error(`[GpsAPI] Error al obtener historial GPS para equipo ${equipoId}:`, error);
      // En caso de error, devolver una lista vacía
      return [];
    }
  }

  async registrarUbicacion(ubicacion: GpsUbicacion): Promise<GpsUbicacion> {
    try {
      console.log(`[GpsAPI] Registrando ubicación para equipo ${ubicacion.equipoId}`);
      
      // 1. Insertar en la tabla de historial gps_registros
      const insertQuery = `
        INSERT INTO gps_registros (
          id, equipo_id, latitud, longitud, velocidad, timestamp, created_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
        )
      `;
      
      await this.db.execute(insertQuery, [
        ubicacion.equipoId,
        ubicacion.latitud,
        ubicacion.longitud,
        ubicacion.velocidad,
        ubicacion.timestamp || new Date()
      ]);
      
      // 2. Actualizar la tabla equipos_ubicacion_actual
      const upsertQuery = `
        INSERT INTO equipos_ubicacion_actual (
          equipo_id, latitud, longitud, velocidad, timestamp, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW()
        )
        ON CONFLICT (equipo_id) 
        DO UPDATE SET 
          latitud = $2,
          longitud = $3,
          velocidad = $4,
          timestamp = $5,
          updated_at = NOW()
      `;
      
      await this.db.execute(upsertQuery, [
        ubicacion.equipoId,
        ubicacion.latitud,
        ubicacion.longitud,
        ubicacion.velocidad,
        ubicacion.timestamp || new Date()
      ]);
      
      // Actualizar la caché con la ubicación más reciente
      const cacheKey = `${this.CACHE_KEY_PREFIX}${ubicacion.equipoId}`;
      await this.cacheService.set(cacheKey, ubicacion, this.CACHE_TTL);
      console.log(`[GpsAPI] Ubicación registrada y actualizada en caché para equipo ${ubicacion.equipoId}`);
      
      return ubicacion;
    } catch (error) {
      console.error(`[GpsAPI] Error al registrar ubicación GPS para equipo ${ubicacion.equipoId}:`, error);
      throw error;
    }
  }

  /**
   * Genera una ubicación GPS por defecto en caso de error
   */
  private generarUbicacionPorDefecto(equipoId: string): GpsUbicacion {
    // Coordenadas predeterminadas para Bogotá según el equipo
    const coordenadasPredeterminadas: Record<string, { lat: number; lng: number }> = {
      'equipo-001': { lat: 4.65, lng: -74.05 },
      'equipo-002': { lat: 4.61, lng: -74.08 },
      'equipo-003': { lat: 4.70, lng: -74.04 },
      'equipo-004': { lat: 4.67, lng: -74.07 },
      'default': { lat: 4.63, lng: -74.06 } // Coordenadas por defecto
    };
    
    // Obtener coordenadas según el equipo o usar las predeterminadas
    const coords = equipoId in coordenadasPredeterminadas 
      ? coordenadasPredeterminadas[equipoId] 
      : coordenadasPredeterminadas['default'];
    
    console.log(`[GpsAPI] Generando ubicación por defecto para equipo ${equipoId}`);
    return {
      equipoId,
      latitud: coords.lat,
      longitud: coords.lng,
      velocidad: 0, // Detenido
      timestamp: new Date()
    };
  }
} 
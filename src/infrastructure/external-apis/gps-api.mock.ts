import { injectable } from 'inversify';
import { IGpsApi, GpsUbicacion } from '../../domain/interfaces/external-apis.interface';
import { ICacheService } from '../cache/redis-client';
import { inject } from 'inversify';
import { TYPES } from '../ioc/types';
import axios from 'axios';
import config from '../config/config';

/**
 * Implementación simulada de la API de GPS para transportistas
 * que ahora consume los endpoints HTTP
 */
@injectable()
export class GpsApiMock implements IGpsApi {
  private readonly CACHE_KEY_PREFIX = 'gps:ubicacion:';
  private readonly CACHE_TTL = 120; // 2 minutos en segundos (la posición GPS cambia rápidamente)
  private readonly API_BASE_URL = `http://localhost:${config.PORT || 3000}`;

  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService
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
      
      // Consumir el endpoint HTTP
      console.log(`[GpsAPI] Consultando API para ubicación de equipo ${equipoId}`);
      const response = await axios.get(`${this.API_BASE_URL}/api/gps/ubicacion/${equipoId}`);
      
      if (!response.data.success) {
        throw new Error(`Error al obtener ubicación GPS: ${response.data.message}`);
      }
      
      const ubicacion = response.data.data;
      
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
      // No usamos caché para datos históricos porque son consultas específicas
      // y probablemente no se repitan exactamente igual
      
      console.log(`[GpsAPI] Consultando API para historial GPS de equipo ${equipoId}`);
      // Formatear fechas para la URL
      const desdeStr = desde.toISOString();
      const hastaStr = hasta.toISOString();
      
      const response = await axios.get(
        `${this.API_BASE_URL}/api/gps/historico/${equipoId}?desde=${desdeStr}&hasta=${hastaStr}`
      );
      
      if (!response.data.success) {
        throw new Error(`Error al obtener historial GPS: ${response.data.message}`);
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`[GpsAPI] Error al obtener historial GPS para equipo ${equipoId}:`, error);
      // En caso de error, devolver una lista vacía
      return [];
    }
  }

  async registrarUbicacion(ubicacion: GpsUbicacion): Promise<GpsUbicacion> {
    try {
      console.log(`[GpsAPI] Registrando ubicación para equipo ${ubicacion.equipoId}`);
      // Registrar en el sistema a través del endpoint HTTP
      const response = await axios.post(`${this.API_BASE_URL}/api/gps/ubicacion`, ubicacion);
      
      if (!response.data.success) {
        throw new Error(`Error al registrar ubicación GPS: ${response.data.message}`);
      }
      
      const nuevaUbicacion = response.data.data;
      
      // Actualizar la caché con la ubicación más reciente
      const cacheKey = `${this.CACHE_KEY_PREFIX}${ubicacion.equipoId}`;
      await this.cacheService.set(cacheKey, nuevaUbicacion, this.CACHE_TTL);
      console.log(`[GpsAPI] Ubicación registrada y actualizada en caché para equipo ${ubicacion.equipoId}`);
      
      return nuevaUbicacion;
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
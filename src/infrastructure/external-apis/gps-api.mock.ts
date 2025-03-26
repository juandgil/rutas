import { injectable } from 'inversify';
import { IGpsApi, GpsUbicacion } from '../../domain/interfaces/external-apis.interface';
import { ICacheService } from '../cache/redis-client';
import { inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementación simulada de la API de GPS para transportistas
 */
@injectable()
export class GpsApiMock implements IGpsApi {
  private readonly CACHE_KEY_PREFIX = 'gps:ubicacion:';
  private readonly CACHE_TTL = 300; // 5 minutos en segundos

  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService
  ) {}

  async obtenerUbicacion(equipoId: string): Promise<GpsUbicacion> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_PREFIX}${equipoId}`;
      const cachedData = await this.cacheService.get<GpsUbicacion>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Simular datos de GPS si no están en caché
      const ubicacion = this.generarUbicacionAleatoria(equipoId);
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, ubicacion, this.CACHE_TTL);
      
      return ubicacion;
    } catch (error) {
      console.error('Error al obtener ubicación GPS:', error);
      // En caso de error, devolver una ubicación aleatoria como fallback
      return this.generarUbicacionAleatoria(equipoId);
    }
  }

  async obtenerHistorico(equipoId: string, desde: Date, hasta: Date): Promise<GpsUbicacion[]> {
    try {
      // Simular un histórico de ubicaciones
      const cantidadRegistros = Math.floor((hasta.getTime() - desde.getTime()) / (5 * 60 * 1000)); // Un registro cada 5 minutos
      const registros: GpsUbicacion[] = [];
      
      let timestamp = new Date(desde);
      
      for (let i = 0; i < cantidadRegistros; i++) {
        registros.push({
          equipoId,
          latitud: 4.6 + (Math.random() * 0.1), // Simular movimiento en Bogotá
          longitud: -74.0 - (Math.random() * 0.1),
          velocidad: Math.random() * 60, // Velocidad entre 0 y 60 km/h
          timestamp: new Date(timestamp)
        });
        
        timestamp = new Date(timestamp.getTime() + 5 * 60 * 1000); // Avanzar 5 minutos
      }
      
      return registros;
    } catch (error) {
      console.error('Error al obtener histórico GPS:', error);
      return [];
    }
  }

  async registrarUbicacion(ubicacion: GpsUbicacion): Promise<GpsUbicacion> {
    try {
      // Asignar ID único y guardar en caché
      const nuevaUbicacion: GpsUbicacion = {
        ...ubicacion,
        timestamp: new Date()
      };
      
      const cacheKey = `${this.CACHE_KEY_PREFIX}${ubicacion.equipoId}`;
      await this.cacheService.set(cacheKey, JSON.stringify(nuevaUbicacion), this.CACHE_TTL);
      
      return nuevaUbicacion;
    } catch (error) {
      console.error('Error al registrar ubicación GPS:', error);
      throw error;
    }
  }

  /**
   * Genera una ubicación GPS aleatoria para simular datos
   */
  private generarUbicacionAleatoria(equipoId: string): GpsUbicacion {
    return {
      equipoId,
      latitud: 4.6 + (Math.random() * 0.1), // Simular ubicaciones en Bogotá
      longitud: -74.0 - (Math.random() * 0.1),
      velocidad: Math.random() * 60, // Velocidad entre 0 y 60 km/h
      timestamp: new Date()
    };
  }
} 
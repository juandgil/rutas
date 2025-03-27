import { injectable } from 'inversify';
import { 
  ITraficoClimaApi, 
  CondicionTrafico, 
  CondicionClima, 
  ImpactoRuta,
  Coordenadas,
  NivelTrafico,
  EstadoClima,
  NivelImpacto
} from '../../domain/interfaces/external-apis.interface';
import { ICacheService } from '../cache/redis-client';
import { inject } from 'inversify';
import { TYPES } from '../ioc/types';
import axios from 'axios';
import config from '../config/config';

/**
 * Implementación simulada de la API de tráfico y clima
 * que ahora consume los endpoints HTTP
 */
@injectable()
export class TraficoClimaApiMock implements ITraficoClimaApi {
  private readonly CACHE_KEY_TRAFICO = 'trafico:ciudad:';
  private readonly CACHE_KEY_CLIMA = 'clima:ciudad:';
  private readonly CACHE_TTL_TRAFICO = 600; // 10 minutos en segundos - El tráfico cambia con frecuencia
  private readonly CACHE_TTL_CLIMA = 1800; // 30 minutos en segundos - El clima cambia menos rápido
  private readonly API_BASE_URL = `http://localhost:${config.PORT || 3000}`;

  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService
  ) {}

  async obtenerCondicionesTrafico(ciudadId: string): Promise<CondicionTrafico> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_TRAFICO}${ciudadId}`;
      const cachedData = await this.cacheService.get<CondicionTrafico>(cacheKey);
      
      if (cachedData) {
        console.log(`[TraficoAPI] Condiciones de tráfico obtenidas de caché para ciudad ${ciudadId}`);
        return cachedData;
      }
      
      // Consumir el endpoint HTTP
      console.log(`[TraficoAPI] Consultando API para condiciones de tráfico en ciudad ${ciudadId}`);
      const response = await axios.get(`${this.API_BASE_URL}/api/trafico-clima/trafico/${ciudadId}`);
      
      if (!response.data.success) {
        throw new Error(`Error al obtener condiciones de tráfico: ${response.data.message}`);
      }
      
      const condicionTrafico = response.data.data;
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, condicionTrafico, this.CACHE_TTL_TRAFICO);
      console.log(`[TraficoAPI] Guardadas condiciones de tráfico en caché para ciudad ${ciudadId}`);
      
      return condicionTrafico;
    } catch (error) {
      console.error(`[TraficoAPI] Error al obtener condiciones de tráfico para ciudad ${ciudadId}:`, error);
      // En caso de error, devolver datos por defecto
      return this.generarCondicionTraficoDefecto(ciudadId);
    }
  }

  async obtenerCondicionesClima(ciudadId: string): Promise<CondicionClima> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_CLIMA}${ciudadId}`;
      const cachedData = await this.cacheService.get<CondicionClima>(cacheKey);
      
      if (cachedData) {
        console.log(`[ClimaAPI] Condiciones climáticas obtenidas de caché para ciudad ${ciudadId}`);
        return cachedData;
      }
      
      // Consumir el endpoint HTTP
      console.log(`[ClimaAPI] Consultando API para condiciones climáticas en ciudad ${ciudadId}`);
      const response = await axios.get(`${this.API_BASE_URL}/api/trafico-clima/clima/${ciudadId}`);
      
      if (!response.data.success) {
        throw new Error(`Error al obtener condiciones climáticas: ${response.data.message}`);
      }
      
      const condicionClima = response.data.data;
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, condicionClima, this.CACHE_TTL_CLIMA);
      console.log(`[ClimaAPI] Guardadas condiciones climáticas en caché para ciudad ${ciudadId}`);
      
      return condicionClima;
    } catch (error) {
      console.error(`[ClimaAPI] Error al obtener condiciones climáticas para ciudad ${ciudadId}:`, error);
      // En caso de error, devolver datos por defecto
      return this.generarCondicionClimaDefecto(ciudadId);
    }
  }

  async obtenerImpactoRuta(origen: Coordenadas, destino: Coordenadas): Promise<ImpactoRuta> {
    try {
      // Para el impacto de ruta no usamos caché porque depende de coordenadas específicas
      // que pueden variar significativamente en cada consulta
      
      // Consumir el endpoint HTTP
      console.log(`[ImpactoAPI] Consultando API para impacto de ruta`);
      const response = await axios.post(`${this.API_BASE_URL}/api/trafico-clima/impacto`, {
        origen,
        destino
      });
      
      if (!response.data.success) {
        throw new Error(`Error al calcular impacto de ruta: ${response.data.message}`);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('[ImpactoAPI] Error al calcular impacto de ruta:', error);
      // En caso de error, devolver un impacto por defecto
      return {
        tiempoAdicional: 5,
        distanciaAdicional: 1,
        nivelImpacto: NivelImpacto.BAJO
      };
    }
  }

  /**
   * Genera condiciones de tráfico por defecto en caso de error
   */
  private generarCondicionTraficoDefecto(ciudadId: string): CondicionTrafico {
    console.log(`[TraficoAPI] Generando condiciones de tráfico por defecto para ciudad ${ciudadId}`);
    return {
      ciudadId,
      nivel: NivelTrafico.MEDIO,
      descripcion: 'Condiciones de tráfico generadas por defecto (no se pudo obtener datos reales)',
      timestamp: new Date()
    };
  }

  /**
   * Genera condiciones de clima por defecto en caso de error
   */
  private generarCondicionClimaDefecto(ciudadId: string): CondicionClima {
    console.log(`[ClimaAPI] Generando condiciones climáticas por defecto para ciudad ${ciudadId}`);
    return {
      ciudadId,
      estado: EstadoClima.NUBLADO,
      temperatura: 18,
      lluvia: 0,
      viento: 5,
      visibilidad: 8,
      descripcion: 'Condiciones climáticas generadas por defecto (no se pudo obtener datos reales)',
      timestamp: new Date()
    };
  }
} 
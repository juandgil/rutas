import { injectable, inject } from 'inversify';
import axios from 'axios';
import { ITraficoClimaApi, CondicionTrafico, CondicionClima, ImpactoRuta, NivelTrafico, EstadoClima, NivelImpacto, Coordenadas } from '../../domain/interfaces/external-apis.interface';
import { TYPES } from '../ioc/types';
import { ICacheService } from '../cache/redis-client';
import config from '../config/config';
import { CircuitBreaker } from './circuit-breaker';

/**
 * Mock de API externa para tráfico y clima
 * En un entorno real, esto sería un servicio que consulta APIs externas
 */
@injectable()
export class TraficoClimaApiMock implements ITraficoClimaApi {
  private readonly CACHE_KEY_TRAFICO = 'trafico:ciudad:';
  private readonly CACHE_KEY_CLIMA = 'clima:ciudad:';
  private readonly CACHE_TTL_TRAFICO = 600; // 10 minutos en segundos - El tráfico cambia con frecuencia
  private readonly CACHE_TTL_CLIMA = 1800; // 30 minutos en segundos - El clima cambia menos rápido
  private readonly API_BASE_URL = `http://localhost:${config.PORT || 3000}`;

  // Circuit breakers para las diferentes operaciones
  private traficoCircuitBreaker: CircuitBreaker;
  private climaCircuitBreaker: CircuitBreaker;
  private impactoCircuitBreaker: CircuitBreaker;

  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService
  ) {
    // Inicializar los circuit breakers
    this.traficoCircuitBreaker = new CircuitBreaker();
    this.climaCircuitBreaker = new CircuitBreaker();
    this.impactoCircuitBreaker = new CircuitBreaker();
  }

  async obtenerCondicionesTrafico(ciudadId: string): Promise<CondicionTrafico> {
    try {
      // Intentar obtener de caché primero
      const cacheKey = `${this.CACHE_KEY_TRAFICO}${ciudadId}`;
      const cachedData = await this.cacheService.get<CondicionTrafico>(cacheKey);
      
      if (cachedData) {
        console.log(`[TraficoAPI] Condiciones de tráfico obtenidas de caché para ciudad ${ciudadId}`);
        return cachedData;
      }
      
      // Ejecutar con circuit breaker
      return await this.traficoCircuitBreaker.execute(
        async () => {
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
        },
        // Fallback
        () => Promise.resolve(this.generarCondicionTraficoDefecto(ciudadId))
      );
    } catch (error) {
      console.error(`[TraficoAPI] Error al obtener condiciones de tráfico para ciudad ${ciudadId}:`, error);
      // En caso de error, devolver datos por defecto
      return Promise.resolve(this.generarCondicionTraficoDefecto(ciudadId));
    }
  }

  async obtenerCondicionesClima(ciudadId: string): Promise<CondicionClima> {
    try {
      // Intentar obtener de caché primero
      const cacheKey = `${this.CACHE_KEY_CLIMA}${ciudadId}`;
      const cachedData = await this.cacheService.get<CondicionClima>(cacheKey);
      
      if (cachedData) {
        console.log(`[ClimaAPI] Condiciones climáticas obtenidas de caché para ciudad ${ciudadId}`);
        return cachedData;
      }
      
      // Ejecutar con circuit breaker
      return await this.climaCircuitBreaker.execute(
        async () => {
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
        },
        // Fallback
        () => Promise.resolve(this.generarCondicionClimaDefecto(ciudadId))
      );
    } catch (error) {
      console.error(`[ClimaAPI] Error al obtener condiciones climáticas para ciudad ${ciudadId}:`, error);
      // En caso de error, devolver datos por defecto
      return Promise.resolve(this.generarCondicionClimaDefecto(ciudadId));
    }
  }

  async obtenerImpactoRuta(origen: Coordenadas, destino: Coordenadas): Promise<ImpactoRuta> {
    try {
      return await this.impactoCircuitBreaker.execute(
        async () => {
          // Consumir el endpoint HTTP
          console.log(`[ImpactoAPI] Consultando impacto de ruta desde [${origen.latitud}, ${origen.longitud}] hasta [${destino.latitud}, ${destino.longitud}]`);
          const response = await axios.post(`${this.API_BASE_URL}/api/trafico-clima/impacto`, {
            origen,
            destino
          });
          
          if (!response.data.success) {
            throw new Error(`Error al obtener impacto de ruta: ${response.data.message}`);
          }
          
          return response.data.data;
        },
        // Fallback: devolver impacto con nivel moderado
        () => Promise.resolve({
          tiempoAdicional: 15,
          distanciaAdicional: 2.5,
          nivelImpacto: NivelImpacto.MEDIO
        })
      );
    } catch (error) {
      console.error(`[ImpactoAPI] Error al obtener impacto de ruta:`, error);
      // En caso de error, devolver datos por defecto
      return Promise.resolve({
        tiempoAdicional: 15,
        distanciaAdicional: 2.5,
        nivelImpacto: NivelImpacto.MEDIO
      });
    }
  }

  private generarCondicionTraficoDefecto(ciudadId: string): CondicionTrafico {
    return {
      ciudadId,
      nivel: NivelTrafico.MEDIO,
      descripcion: 'Tráfico moderado (datos por defecto)',
      timestamp: new Date()
    };
  }

  private generarCondicionClimaDefecto(ciudadId: string): CondicionClima {
    return {
      ciudadId,
      estado: EstadoClima.NUBLADO,
      temperatura: 18,
      lluvia: 0,
      viento: 10,
      visibilidad: 8,
      descripcion: 'Parcialmente nublado (datos por defecto)',
      timestamp: new Date()
    };
  }
} 
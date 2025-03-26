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

/**
 * Implementación simulada de la API de tráfico y clima
 */
@injectable()
export class TraficoClimaApiMock implements ITraficoClimaApi {
  private readonly CACHE_KEY_TRAFICO = 'trafico:ciudad:';
  private readonly CACHE_KEY_CLIMA = 'clima:ciudad:';
  private readonly CACHE_TTL = 1800; // 30 minutos en segundos

  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService
  ) {}

  async obtenerCondicionesTrafico(ciudadId: string): Promise<CondicionTrafico> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_TRAFICO}${ciudadId}`;
      const cachedData = await this.cacheService.get<CondicionTrafico>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Simular datos de tráfico si no están en caché
      const condicionTrafico = this.generarCondicionTraficoAleatoria(ciudadId);
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, condicionTrafico, this.CACHE_TTL);
      
      return condicionTrafico;
    } catch (error) {
      console.error('Error al obtener condiciones de tráfico:', error);
      // En caso de error, devolver datos aleatorios como fallback
      return this.generarCondicionTraficoAleatoria(ciudadId);
    }
  }

  async obtenerCondicionesClima(ciudadId: string): Promise<CondicionClima> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_CLIMA}${ciudadId}`;
      const cachedData = await this.cacheService.get<CondicionClima>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Simular datos de clima si no están en caché
      const condicionClima = this.generarCondicionClimaAleatoria(ciudadId);
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, condicionClima, this.CACHE_TTL);
      
      return condicionClima;
    } catch (error) {
      console.error('Error al obtener condiciones de clima:', error);
      // En caso de error, devolver datos aleatorios como fallback
      return this.generarCondicionClimaAleatoria(ciudadId);
    }
  }

  async obtenerImpactoRuta(origen: Coordenadas, destino: Coordenadas): Promise<ImpactoRuta> {
    try {
      // Calcular distancia entre puntos (fórmula simplificada para demo)
      const distancia = Math.sqrt(
        Math.pow(destino.latitud - origen.latitud, 2) +
        Math.pow(destino.longitud - origen.longitud, 2)
      ) * 111.32; // Aproximación a km (1 grado ~ 111.32 km en el ecuador)
      
      // Generar un impacto aleatorio basado en la distancia
      const impacto = this.generarImpactoRutaAleatorio(distancia);
      
      return impacto;
    } catch (error) {
      console.error('Error al calcular impacto de ruta:', error);
      // En caso de error, devolver un impacto mínimo
      return {
        tiempoAdicional: 5,
        distanciaAdicional: 1,
        nivelImpacto: NivelImpacto.BAJO
      };
    }
  }

  /**
   * Genera condiciones de tráfico aleatorias para simular datos
   */
  private generarCondicionTraficoAleatoria(ciudadId: string): CondicionTrafico {
    const nivelesTrafico = Object.values(NivelTrafico);
    const nivelAleatorio = nivelesTrafico[Math.floor(Math.random() * nivelesTrafico.length)];
    
    const descripciones = {
      [NivelTrafico.BAJO]: 'Tráfico fluido en toda la ciudad',
      [NivelTrafico.MEDIO]: 'Tráfico moderado en algunas vías principales',
      [NivelTrafico.ALTO]: 'Tráfico denso en varias zonas de la ciudad',
      [NivelTrafico.CONGESTIONADO]: 'Congestión severa en múltiples puntos'
    };
    
    return {
      ciudadId,
      nivel: nivelAleatorio,
      descripcion: descripciones[nivelAleatorio],
      timestamp: new Date()
    };
  }

  /**
   * Genera condiciones de clima aleatorias para simular datos
   */
  private generarCondicionClimaAleatoria(ciudadId: string): CondicionClima {
    const estadosClima = Object.values(EstadoClima);
    const estadoAleatorio = estadosClima[Math.floor(Math.random() * estadosClima.length)];
    
    // Generar datos realistas según el estado del clima
    let temperatura = 0;
    let lluvia = 0;
    let viento = 0;
    let visibilidad = 10;
    
    switch (estadoAleatorio) {
      case EstadoClima.DESPEJADO:
        temperatura = 18 + (Math.random() * 12); // 18-30°C
        lluvia = 0;
        viento = Math.random() * 10; // 0-10 km/h
        visibilidad = 8 + (Math.random() * 2); // 8-10 km
        break;
      case EstadoClima.NUBLADO:
        temperatura = 14 + (Math.random() * 10); // 14-24°C
        lluvia = Math.random() * 0.5; // 0-0.5 mm
        viento = 5 + (Math.random() * 15); // 5-20 km/h
        visibilidad = 5 + (Math.random() * 3); // 5-8 km
        break;
      case EstadoClima.LLUVIOSO:
        temperatura = 10 + (Math.random() * 8); // 10-18°C
        lluvia = 2 + (Math.random() * 8); // 2-10 mm
        viento = 10 + (Math.random() * 20); // 10-30 km/h
        visibilidad = 2 + (Math.random() * 3); // 2-5 km
        break;
      case EstadoClima.TORMENTA:
        temperatura = 8 + (Math.random() * 7); // 8-15°C
        lluvia = 10 + (Math.random() * 20); // 10-30 mm
        viento = 20 + (Math.random() * 40); // 20-60 km/h
        visibilidad = 0.5 + (Math.random() * 1.5); // 0.5-2 km
        break;
    }
    
    // Descripciones según el estado del clima
    const descripciones = {
      [EstadoClima.DESPEJADO]: 'Cielo despejado, condiciones óptimas para circulación',
      [EstadoClima.NUBLADO]: 'Cielo nublado, visibilidad aceptable',
      [EstadoClima.LLUVIOSO]: 'Lluvia moderada, precaución en las vías',
      [EstadoClima.TORMENTA]: 'Tormenta fuerte, visibilidad reducida y riesgo de inundaciones'
    };
    
    return {
      ciudadId,
      estado: estadoAleatorio,
      temperatura: Math.round(temperatura * 10) / 10, // Redondear a 1 decimal
      lluvia: Math.round(lluvia * 10) / 10,
      viento: Math.round(viento),
      visibilidad: Math.round(visibilidad * 10) / 10,
      descripcion: descripciones[estadoAleatorio],
      timestamp: new Date()
    };
  }

  /**
   * Genera un impacto de ruta aleatorio basado en la distancia
   */
  private generarImpactoRutaAleatorio(distancia: number): ImpactoRuta {
    // A mayor distancia, mayor probabilidad de impacto alto
    let nivelImpacto: NivelImpacto;
    let factor = 0;
    
    if (distancia < 5) {
      // Distancias cortas tienen impactos menores
      const probabilidad = Math.random();
      if (probabilidad < 0.7) {
        nivelImpacto = NivelImpacto.BAJO;
        factor = 0.1;
      } else if (probabilidad < 0.9) {
        nivelImpacto = NivelImpacto.MEDIO;
        factor = 0.2;
      } else {
        nivelImpacto = NivelImpacto.ALTO;
        factor = 0.3;
      }
    } else if (distancia < 15) {
      // Distancias medias
      const probabilidad = Math.random();
      if (probabilidad < 0.4) {
        nivelImpacto = NivelImpacto.BAJO;
        factor = 0.15;
      } else if (probabilidad < 0.8) {
        nivelImpacto = NivelImpacto.MEDIO;
        factor = 0.25;
      } else {
        nivelImpacto = Math.random() < 0.8 ? NivelImpacto.ALTO : NivelImpacto.CRITICO;
        factor = 0.35;
      }
    } else {
      // Distancias largas tienen impactos mayores
      const probabilidad = Math.random();
      if (probabilidad < 0.2) {
        nivelImpacto = NivelImpacto.BAJO;
        factor = 0.2;
      } else if (probabilidad < 0.5) {
        nivelImpacto = NivelImpacto.MEDIO;
        factor = 0.3;
      } else if (probabilidad < 0.8) {
        nivelImpacto = NivelImpacto.ALTO;
        factor = 0.4;
      } else {
        nivelImpacto = NivelImpacto.CRITICO;
        factor = 0.5;
      }
    }
    
    // Calcular tiempo y distancia adicionales
    const tiempoAdicional = Math.round(distancia * factor * 60); // en minutos
    const distanciaAdicional = Math.round(distancia * factor * 10) / 10; // en km
    
    return {
      tiempoAdicional,
      distanciaAdicional,
      nivelImpacto
    };
  }
} 
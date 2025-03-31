import { injectable, inject } from 'inversify';
import { ITraficoClimaService } from '../interfaces/trafico-clima-service.interface';
import { TYPES } from '../../infrastructure/ioc/types';
import { ITraficoClimaApi, CondicionTrafico, CondicionClima, Coordenadas, ImpactoRuta, NivelTrafico, EstadoClima, NivelImpacto } from '../../domain/interfaces/external-apis.interface';

@injectable()
export class TraficoClimaService implements ITraficoClimaService {
  constructor(
    @inject(TYPES.ITraficoClimaApi) private traficoClimaApi: ITraficoClimaApi
  ) {}
  
  /**
   * Obtiene las condiciones de tráfico actuales para una ciudad
   * @param ciudadId ID de la ciudad
   */
  async obtenerCondicionesTrafico(ciudadId: string): Promise<CondicionTrafico> {
    try {
      return await this.traficoClimaApi.obtenerCondicionesTrafico(ciudadId);
    } catch (error) {
      console.error(`Error al obtener condiciones de tráfico para ciudad ${ciudadId}:`, error);
      // Retornar condiciones por defecto en caso de error
      return {
        ciudadId,
        nivel: NivelTrafico.BAJO,
        descripcion: 'Error al obtener datos reales. Usando condiciones por defecto.',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Obtiene las condiciones climáticas actuales para una ciudad
   * @param ciudadId ID de la ciudad
   */
  async obtenerCondicionesClima(ciudadId: string): Promise<CondicionClima> {
    try {
      return await this.traficoClimaApi.obtenerCondicionesClima(ciudadId);
    } catch (error) {
      console.error(`Error al obtener condiciones climáticas para ciudad ${ciudadId}:`, error);
      // Retornar condiciones por defecto en caso de error
      return {
        ciudadId,
        estado: EstadoClima.DESPEJADO,
        temperatura: 20,
        lluvia: 0,
        viento: 5,
        visibilidad: 10,
        descripcion: 'Error al obtener datos reales. Usando condiciones por defecto.',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Calcula el impacto que tendrán las condiciones actuales en una ruta específica
   * @param origen Coordenadas del punto de origen
   * @param destino Coordenadas del punto de destino
   */
  async calcularImpactoRuta(origen: Coordenadas, destino: Coordenadas): Promise<ImpactoRuta> {
    try {
      return await this.traficoClimaApi.obtenerImpactoRuta(origen, destino);
    } catch (error) {
      console.error(`Error al calcular impacto de ruta:`, error);
      // Retornar impacto por defecto en caso de error
      return {
        tiempoAdicional: 0,
        distanciaAdicional: 0,
        nivelImpacto: NivelImpacto.BAJO
      };
    }
  }
  
  /**
   * Devuelve una evaluación general de las condiciones para una ciudad, combinando tráfico y clima
   * @param ciudadId ID de la ciudad
   */
  async evaluarCondicionesGenerales(ciudadId: string): Promise<{
    nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    factorDelay: number;
    recomendaciones: string[];
  }> {
    // Obtener condiciones actuales de tráfico y clima
    const [condicionesTrafico, condicionesClima] = await Promise.all([
      this.obtenerCondicionesTrafico(ciudadId),
      this.obtenerCondicionesClima(ciudadId)
    ]);
    
    // Evaluar nivel de riesgo combinando ambas condiciones
    let nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO' = 'BAJO';
    let factorDelay = 1.0;
    const recomendaciones: string[] = [];
    
    // Evaluar tráfico
    if (condicionesTrafico.nivel === NivelTrafico.CONGESTIONADO) {
      nivelRiesgo = 'ALTO';
      factorDelay *= 2.0;
      recomendaciones.push('Tráfico extremadamente congestionado, considerar rutas alternativas.');
    } else if (condicionesTrafico.nivel === NivelTrafico.ALTO) {
      nivelRiesgo = Math.max(nivelRiesgo === 'BAJO' ? 0 : nivelRiesgo === 'MEDIO' ? 1 : 2, 1) === 2 ? 'ALTO' : 'MEDIO';
      factorDelay *= 1.5;
      recomendaciones.push('Tráfico elevado, evaluar modificación de rutas.');
    } else if (condicionesTrafico.nivel === NivelTrafico.MEDIO) {
      nivelRiesgo = nivelRiesgo === 'BAJO' ? 'MEDIO' : nivelRiesgo;
      factorDelay *= 1.2;
      recomendaciones.push('Tráfico moderado, considerar ajustes en tiempos de entrega.');
    }
    
    // Evaluar clima
    if (condicionesClima.estado === EstadoClima.TORMENTA) {
      nivelRiesgo = 'ALTO';
      factorDelay *= 1.8;
      recomendaciones.push('Condiciones de tormenta, reducir velocidad y evaluar replanificación de rutas.');
      
      // Si hay tormenta y tráfico alto, elevar a crítico
      if (condicionesTrafico.nivel === NivelTrafico.ALTO || condicionesTrafico.nivel === NivelTrafico.CONGESTIONADO) {
        nivelRiesgo = 'CRITICO';
        recomendaciones.push('Combinación de tormenta y tráfico intenso. Reconsiderar rutas urgentemente.');
      }
      
    } else if (condicionesClima.estado === EstadoClima.LLUVIOSO) {
      nivelRiesgo = Math.max(nivelRiesgo === 'BAJO' ? 0 : nivelRiesgo === 'MEDIO' ? 1 : 2, 1) === 2 ? 'ALTO' : 'MEDIO';
      factorDelay *= 1.4;
      recomendaciones.push('Lluvia en la zona, reducir velocidad y aumentar tiempo entre entregas.');
    } else if (condicionesClima.estado === EstadoClima.NUBLADO) {
      if (nivelRiesgo === 'BAJO') {
        nivelRiesgo = 'BAJO';
        factorDelay *= 1.1;
      }
    }
    
    // Añadir recomendaciones específicas basadas en condiciones combinadas
    if (condicionesClima.visibilidad < 5) {
      recomendaciones.push('Baja visibilidad, conducir con precaución.');
      factorDelay *= 1.2;
    }
    
    if (condicionesClima.viento > 40) {
      recomendaciones.push('Vientos fuertes, precaución con vehículos de carga alta.');
      factorDelay *= 1.3;
    }
    
    return {
      nivelRiesgo,
      factorDelay,
      recomendaciones
    };
  }
} 
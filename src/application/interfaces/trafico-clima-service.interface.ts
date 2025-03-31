import { 
  CondicionTrafico, 
  CondicionClima, 
  ImpactoRuta,
  Coordenadas
} from '../../domain/interfaces/external-apis.interface';

/**
 * Interfaz para el servicio que maneja las condiciones de tráfico y clima
 */
export interface ITraficoClimaService {
  /**
   * Obtiene las condiciones de tráfico actuales para una ciudad
   * @param ciudadId ID de la ciudad
   */
  obtenerCondicionesTrafico(ciudadId: string): Promise<CondicionTrafico>;
  
  /**
   * Obtiene las condiciones climáticas actuales para una ciudad
   * @param ciudadId ID de la ciudad
   */
  obtenerCondicionesClima(ciudadId: string): Promise<CondicionClima>;
  
  /**
   * Calcula el impacto que tendrán las condiciones actuales en una ruta específica
   * @param origen Coordenadas del punto de origen
   * @param destino Coordenadas del punto de destino
   */
  calcularImpactoRuta(origen: Coordenadas, destino: Coordenadas): Promise<ImpactoRuta>;
  
  /**
   * Devuelve una evaluación general de las condiciones para una ciudad, combinando tráfico y clima
   * @param ciudadId ID de la ciudad
   */
  evaluarCondicionesGenerales(ciudadId: string): Promise<{
    nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    factorDelay: number;
    recomendaciones: string[];
  }>;
} 
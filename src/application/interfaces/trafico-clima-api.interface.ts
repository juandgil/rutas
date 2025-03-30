import { CondicionTrafico, CondicionClima, ImpactoRuta, Coordenadas } from '../../domain/interfaces/external-apis.interface';

/**
 * Interfaz para la API de tráfico y clima
 */
export interface ITraficoClimaApi {
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
   * Calcula el impacto de las condiciones actuales en una ruta específica
   * @param origen Coordenadas de origen
   * @param destino Coordenadas de destino
   */
  obtenerImpactoRuta(origen: Coordenadas, destino: Coordenadas): Promise<ImpactoRuta>;
} 
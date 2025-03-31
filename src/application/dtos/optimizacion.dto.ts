import { Ruta } from '../../domain/entities/ruta.entity';
import { Envio } from '../../domain/entities/envio.entity';
import { NivelImpacto } from '../../domain/interfaces/external-apis.interface';

/**
 * DTO para representar un tramo de ruta
 */
export interface TramoDto {
  id: string;
  origen: string;
  destino: string;
  distancia: number;
  tiempoEstimado: number;
  ordenEntrega: number;
  ciudadId: string;
  latitudOrigen: number;
  longitudOrigen: number;
  latitudDestino: number;
  longitudDestino: number;
}

/**
 * DTO para la respuesta de optimización de ruta
 */
export interface OptimizarRutaResponseDto {
  rutaId: string;
  equipoId: string;
  fechaCreacion: Date;
  tramos: TramoDto[];
  tiempoEstimadoTotal: number;
  distanciaTotal: number;
  envios: string[];
}

/**
 * DTO para representar un envío con su información de optimización
 */
export interface EnvioOptimizacionDto {
  envio: Envio;
  distancia: number;
  puntaje: number;
  impacto: NivelImpacto;
}

/**
 * DTO para los resultados del algoritmo de optimización
 */
export interface ResultadoOptimizacion {
  enviosOrdenados: Envio[];
  distanciaTotal: number;
  tiempoEstimado: number;
}

/**
 * DTO para optimización masiva
 */
export interface ResultadoOptimizacionMasiva {
  rutasCreadas: Ruta[];
  enviosAsignados: number;
  equiposOptimizados: number;
}

/**
 * DTO para propuesta de ruta
 */
export interface RutaPropuesta {
  id?: string;
  equipoId: string;
  envios: Envio[];
  tramos: any[];
  tiempoEstimado: number;
  distanciaTotal: number;
  requiereModificacion?: boolean;
} 
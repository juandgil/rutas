import { Ruta } from '../../domain/entities/ruta.entity';

export interface IOptimizacionService {
  optimizarRuta(equipoId: string, fecha: Date): Promise<Ruta>;
  replanificarRuta(equipoId: string, eventoId: string): Promise<Ruta | null>;
  validarReplanificacion(equipoId: string, eventoId: string): Promise<boolean>;
} 
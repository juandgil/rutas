import { Ruta, EstadoRuta } from '../entities/ruta.entity';
import { IBaseRepository } from './base.repository';

export interface IRutaRepository extends IBaseRepository<Ruta, string> {
  findByEquipo(equipoId: string): Promise<Ruta[]>;
  findByEquipoYFecha(equipoId: string, fecha: Date): Promise<Ruta | null>;
  findByEstado(estado: EstadoRuta): Promise<Ruta[]>;
  actualizarEstado(id: string, estado: EstadoRuta): Promise<Ruta>;
  actualizarEnvios(id: string, envios: string[]): Promise<Ruta>;
  marcarReplanificada(id: string, eventoId: string): Promise<Ruta>;
  existeReplanificacionPrevia(equipoId: string, eventoId: string, fecha: Date): Promise<boolean>;
} 
import { Gps } from '../entities/gps.entity';
import { IBaseRepository } from './base.repository';

export interface IGpsRepository extends IBaseRepository<Gps, string> {
  findByEquipo(equipoId: string): Promise<Gps[]>;
  findUltimaUbicacion(equipoId: string): Promise<Gps | null>;
  findByRango(desde: Date, hasta: Date): Promise<Gps[]>;
  findByEquipoYRango(equipoId: string, desde: Date, hasta: Date): Promise<Gps[]>;
} 
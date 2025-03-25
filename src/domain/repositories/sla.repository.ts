import { Sla } from '../entities/sla.entity';
import { IBaseRepository } from './base.repository';

export interface ISlaRepository extends IBaseRepository<Sla, string> {
  findActivos(): Promise<Sla[]>;
  findByPrioridad(prioridad: number): Promise<Sla[]>;
  actualizarEstado(id: string, activo: boolean): Promise<Sla>;
} 
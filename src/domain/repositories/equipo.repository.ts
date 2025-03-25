import { Equipo } from '../entities/equipo.entity';
import { IBaseRepository } from './base.repository';

export interface IEquipoRepository extends IBaseRepository<Equipo, string> {
  findByVehiculoId(vehiculoId: string): Promise<Equipo[]>;
  findByCiudad(ciudadId: string): Promise<Equipo[]>;
  findDisponibles(): Promise<Equipo[]>;
  actualizarDisponibilidad(id: string, disponible: boolean): Promise<Equipo>;
} 
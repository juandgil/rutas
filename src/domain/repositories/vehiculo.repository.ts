import { Vehiculo, TipoVehiculo } from '../entities/vehiculo.entity';
import { IBaseRepository } from './base.repository';

export interface IVehiculoRepository extends IBaseRepository<Vehiculo, string> {
  findByTipo(tipo: TipoVehiculo): Promise<Vehiculo[]>;
  findDisponibles(): Promise<Vehiculo[]>;
  findByCapacidad(pesoMinimo: number, volumenMinimo: number): Promise<Vehiculo[]>;
  actualizarDisponibilidad(id: string, disponible: boolean): Promise<Vehiculo>;
} 
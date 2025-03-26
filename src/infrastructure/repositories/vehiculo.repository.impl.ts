import { injectable, inject } from 'inversify';
import { BaseRepository } from './base.repository.impl';
import { IVehiculoRepository } from '../../domain/repositories/vehiculo.repository';
import { Vehiculo, TipoVehiculo } from '../../domain/entities/vehiculo.entity';
import { IDatabase } from '../database/database';
import { TYPES } from '../ioc/types';

@injectable()
export class VehiculoRepository extends BaseRepository<Vehiculo, string> implements IVehiculoRepository {
  constructor(@inject(TYPES.IDatabase) db: IDatabase) {
    super(db, 'vehiculos', 'id');
  }

  async findByTipo(tipo: TipoVehiculo): Promise<Vehiculo[]> {
    try {
      const query = 'SELECT * FROM vehiculos WHERE tipo = $1';
      return await this.db.query<Vehiculo>(query, [tipo]);
    } catch (error) {
      console.error('Error al buscar vehículos por tipo:', error);
      throw error;
    }
  }

  async findDisponibles(): Promise<Vehiculo[]> {
    try {
      const query = 'SELECT * FROM vehiculos WHERE disponible = true';
      return await this.db.query<Vehiculo>(query);
    } catch (error) {
      console.error('Error al buscar vehículos disponibles:', error);
      throw error;
    }
  }

  async findByCapacidad(pesoMinimo: number, volumenMinimo: number): Promise<Vehiculo[]> {
    try {
      const query = 'SELECT * FROM vehiculos WHERE capacidad_peso >= $1 AND capacidad_volumen >= $2';
      return await this.db.query<Vehiculo>(query, [pesoMinimo, volumenMinimo]);
    } catch (error) {
      console.error('Error al buscar vehículos por capacidad:', error);
      throw error;
    }
  }

  async actualizarDisponibilidad(id: string, disponible: boolean): Promise<Vehiculo> {
    try {
      const query = `
        UPDATE vehiculos
        SET disponible = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Vehiculo>(query, [disponible, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el vehículo con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al actualizar disponibilidad del vehículo:', error);
      throw error;
    }
  }
} 
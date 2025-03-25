import { injectable, inject } from 'inversify';
import { BaseRepository } from './base.repository.impl';
import { IEquipoRepository } from '../../domain/repositories/equipo.repository';
import { Equipo } from '../../domain/entities/equipo.entity';
import { IDatabase } from '../database/database';
import { TYPES } from '../ioc/types';

@injectable()
export class EquipoRepository extends BaseRepository<Equipo, string> implements IEquipoRepository {
  constructor(@inject(TYPES.IDatabase) db: IDatabase) {
    super(db, 'equipos');
  }

  async findByVehiculoId(vehiculoId: string): Promise<Equipo[]> {
    try {
      const query = 'SELECT * FROM equipos WHERE vehiculo_id = $1';
      return await this.db.query<Equipo>(query, [vehiculoId]);
    } catch (error) {
      console.error('Error al buscar equipos por vehículo ID:', error);
      throw error;
    }
  }

  async findByCiudad(ciudadId: string): Promise<Equipo[]> {
    try {
      const query = 'SELECT * FROM equipos WHERE ciudad_id = $1';
      return await this.db.query<Equipo>(query, [ciudadId]);
    } catch (error) {
      console.error('Error al buscar equipos por ciudad ID:', error);
      throw error;
    }
  }

  async findDisponibles(): Promise<Equipo[]> {
    try {
      const query = 'SELECT * FROM equipos WHERE disponible = true';
      return await this.db.query<Equipo>(query);
    } catch (error) {
      console.error('Error al buscar equipos disponibles:', error);
      throw error;
    }
  }

  async actualizarDisponibilidad(id: string, disponible: boolean): Promise<Equipo> {
    try {
      const query = `
        UPDATE equipos
        SET disponible = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Equipo>(query, [disponible, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el equipo con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al actualizar disponibilidad del equipo:', error);
      throw error;
    }
  }
} 
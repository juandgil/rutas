import { injectable, inject } from 'inversify';
import { BaseRepository } from './base.repository.impl';
import { IGpsRepository } from '../../domain/repositories/gps.repository';
import { Gps } from '../../domain/entities/gps.entity';
import { IDatabase } from '../database/database';
import { TYPES } from '../ioc/types';

@injectable()
export class GpsRepository extends BaseRepository<Gps, string> implements IGpsRepository {
  constructor(@inject(TYPES.IDatabase) db: IDatabase) {
    super(db, 'gps_logs', 'id');
  }

  async findByEquipo(equipoId: string): Promise<Gps[]> {
    try {
      const query = 'SELECT * FROM gps_registros WHERE equipo_id = $1 ORDER BY timestamp DESC';
      return await this.db.query<Gps>(query, [equipoId]);
    } catch (error) {
      console.error('Error al buscar registros GPS por equipo:', error);
      throw error;
    }
  }

  async findUltimaUbicacion(equipoId: string): Promise<Gps | null> {
    try {
      const query = `
        SELECT * FROM gps_registros 
        WHERE equipo_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 1
      `;
      const result = await this.db.query<Gps>(query, [equipoId]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error al buscar última ubicación del equipo:', error);
      throw error;
    }
  }

  async findByRango(desde: Date, hasta: Date): Promise<Gps[]> {
    try {
      const query = `
        SELECT * FROM gps_registros 
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp DESC
      `;
      return await this.db.query<Gps>(query, [desde.toISOString(), hasta.toISOString()]);
    } catch (error) {
      console.error('Error al buscar registros GPS por rango de fechas:', error);
      throw error;
    }
  }

  async findByEquipoYRango(equipoId: string, desde: Date, hasta: Date): Promise<Gps[]> {
    try {
      const query = `
        SELECT * FROM gps_registros 
        WHERE equipo_id = $1 
        AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp DESC
      `;
      return await this.db.query<Gps>(query, [equipoId, desde.toISOString(), hasta.toISOString()]);
    } catch (error) {
      console.error('Error al buscar registros GPS por equipo y rango de fechas:', error);
      throw error;
    }
  }
} 
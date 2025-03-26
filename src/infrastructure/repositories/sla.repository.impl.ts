import { injectable, inject } from 'inversify';
import { BaseRepository } from './base.repository.impl';
import { ISlaRepository } from '../../domain/repositories/sla.repository';
import { Sla } from '../../domain/entities/sla.entity';
import { IDatabase } from '../database/database';
import { TYPES } from '../ioc/types';

@injectable()
export class SlaRepository extends BaseRepository<Sla, string> implements ISlaRepository {
  constructor(@inject(TYPES.IDatabase) db: IDatabase) {
    super(db, 'slas', 'id');
  }

  async findActivos(): Promise<Sla[]> {
    try {
      const query = 'SELECT * FROM slas WHERE activo = true ORDER BY prioridad ASC';
      return await this.db.query<Sla>(query);
    } catch (error) {
      console.error('Error al buscar SLAs activos:', error);
      throw error;
    }
  }

  async findByPrioridad(prioridad: number): Promise<Sla[]> {
    try {
      const query = 'SELECT * FROM slas WHERE prioridad = $1';
      return await this.db.query<Sla>(query, [prioridad]);
    } catch (error) {
      console.error('Error al buscar SLAs por prioridad:', error);
      throw error;
    }
  }

  async actualizarEstado(id: string, activo: boolean): Promise<Sla> {
    try {
      const query = `
        UPDATE slas
        SET activo = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Sla>(query, [activo, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el SLA con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al actualizar estado del SLA:', error);
      throw error;
    }
  }
} 
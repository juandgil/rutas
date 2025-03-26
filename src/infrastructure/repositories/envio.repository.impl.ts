import { injectable, inject } from 'inversify';
import { BaseRepository } from './base.repository.impl';
import { IEnvioRepository } from '../../domain/repositories/envio.repository';
import { Envio, EstadoEnvio } from '../../domain/entities/envio.entity';
import { IDatabase } from '../database/database';
import { TYPES } from '../ioc/types';

@injectable()
export class EnvioRepository extends BaseRepository<Envio, string> implements IEnvioRepository {
  constructor(@inject(TYPES.IDatabase) db: IDatabase) {
    super(db, 'envios', 'id');
  }

  async findByGuia(guia: string): Promise<Envio | null> {
    try {
      const query = 'SELECT * FROM envios WHERE guia = $1';
      const result = await this.db.query<Envio>(query, [guia]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error al buscar envío por guía:', error);
      throw error;
    }
  }

  async findByEquipo(equipoId: string): Promise<Envio[]> {
    try {
      const query = 'SELECT * FROM envios WHERE equipo_id = $1';
      return await this.db.query<Envio>(query, [equipoId]);
    } catch (error) {
      console.error('Error al buscar envíos por equipo:', error);
      throw error;
    }
  }

  async findByEstado(estado: EstadoEnvio): Promise<Envio[]> {
    try {
      const query = 'SELECT * FROM envios WHERE estado = $1';
      return await this.db.query<Envio>(query, [estado]);
    } catch (error) {
      console.error('Error al buscar envíos por estado:', error);
      throw error;
    }
  }

  async findBySla(slaId: string): Promise<Envio[]> {
    try {
      const query = 'SELECT * FROM envios WHERE sla_id = $1';
      return await this.db.query<Envio>(query, [slaId]);
    } catch (error) {
      console.error('Error al buscar envíos por SLA:', error);
      throw error;
    }
  }

  async findByCiudad(ciudadId: string): Promise<Envio[]> {
    try {
      const query = 'SELECT * FROM envios WHERE ciudad_id = $1';
      return await this.db.query<Envio>(query, [ciudadId]);
    } catch (error) {
      console.error('Error al buscar envíos por ciudad:', error);
      throw error;
    }
  }

  async findPendientesByEquipo(equipoId: string): Promise<Envio[]> {
    try {
      const query = `
        SELECT * FROM envios 
        WHERE equipo_id = $1 
        AND estado IN ('${EstadoEnvio.ASIGNADO}', '${EstadoEnvio.EN_RUTA}')
        ORDER BY orden_entrega ASC
      `;
      return await this.db.query<Envio>(query, [equipoId]);
    } catch (error) {
      console.error('Error al buscar envíos pendientes por equipo:', error);
      throw error;
    }
  }

  async actualizarEstado(id: string, estado: EstadoEnvio): Promise<Envio> {
    try {
      const query = `
        UPDATE envios
        SET estado = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Envio>(query, [estado, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el envío con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al actualizar estado del envío:', error);
      throw error;
    }
  }

  async actualizarOrdenEntrega(id: string, ordenEntrega: number): Promise<Envio> {
    try {
      const query = `
        UPDATE envios
        SET orden_entrega = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Envio>(query, [ordenEntrega, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el envío con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al actualizar orden de entrega del envío:', error);
      throw error;
    }
  }

  async asignarAEquipo(id: string, equipoId: string): Promise<Envio> {
    try {
      const query = `
        UPDATE envios
        SET equipo_id = $1, estado = '${EstadoEnvio.ASIGNADO}', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Envio>(query, [equipoId, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el envío con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al asignar envío a equipo:', error);
      throw error;
    }
  }
} 
import { injectable, inject } from 'inversify';
import { BaseRepository } from './base.repository.impl';
import { IRutaRepository } from '../../domain/repositories/ruta.repository';
import { Ruta, EstadoRuta } from '../../domain/entities/ruta.entity';
import { IDatabase } from '../database/database';
import { TYPES } from '../ioc/types';

@injectable()
export class RutaRepository extends BaseRepository<Ruta, string> implements IRutaRepository {
  constructor(@inject(TYPES.IDatabase) db: IDatabase) {
    super(db, 'rutas', 'id');
  }

  async findByEquipo(equipoId: string): Promise<Ruta[]> {
    try {
      const query = 'SELECT * FROM rutas WHERE equipo_id = $1 ORDER BY fecha DESC';
      return await this.db.query<Ruta>(query, [equipoId]);
    } catch (error) {
      console.error('Error al buscar rutas por equipo:', error);
      throw error;
    }
  }

  async findByEquipoYFecha(equipoId: string, fecha: Date): Promise<Ruta | null> {
    try {
      // Convertir fecha a formato YYYY-MM-DD
      const fechaFormateada = fecha.toISOString().split('T')[0];
      
      const query = `
        SELECT * FROM rutas 
        WHERE equipo_id = $1 
        AND DATE(fecha) = DATE($2)
      `;
      const result = await this.db.query<Ruta>(query, [equipoId, fechaFormateada]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error al buscar ruta por equipo y fecha:', error);
      throw error;
    }
  }

  async findByEstado(estado: EstadoRuta): Promise<Ruta[]> {
    try {
      const query = 'SELECT * FROM rutas WHERE estado = $1';
      return await this.db.query<Ruta>(query, [estado]);
    } catch (error) {
      console.error('Error al buscar rutas por estado:', error);
      throw error;
    }
  }

  async actualizarEstado(id: string, estado: EstadoRuta): Promise<Ruta> {
    try {
      const query = `
        UPDATE rutas
        SET estado = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Ruta>(query, [estado, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró la ruta con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al actualizar estado de la ruta:', error);
      throw error;
    }
  }

  async actualizarEnvios(id: string, envios: string[]): Promise<Ruta> {
    try {
      const query = `
        UPDATE rutas
        SET envios = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Ruta>(query, [JSON.stringify(envios), id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró la ruta con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al actualizar envíos de la ruta:', error);
      throw error;
    }
  }

  async marcarReplanificada(id: string, eventoId: string): Promise<Ruta> {
    try {
      const query = `
        UPDATE rutas
        SET replanificada = true, ultimo_evento_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await this.db.query<Ruta>(query, [eventoId, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró la ruta con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al marcar ruta como replanificada:', error);
      throw error;
    }
  }

  async existeReplanificacionPrevia(equipoId: string, eventoId: string, fecha: Date): Promise<boolean> {
    try {
      // Convertir fecha a formato YYYY-MM-DD
      const fechaFormateada = fecha.toISOString().split('T')[0];
      
      const query = `
        SELECT COUNT(*) as count FROM rutas 
        WHERE equipo_id = $1 
        AND DATE(fecha) = DATE($2)
        AND replanificada = true
        AND ultimo_evento_id = $3
      `;
      const result = await this.db.one<{ count: number }>(query, [equipoId, fechaFormateada, eventoId]);
      return result.count > 0;
    } catch (error) {
      console.error('Error al verificar replanificación previa:', error);
      throw error;
    }
  }
} 
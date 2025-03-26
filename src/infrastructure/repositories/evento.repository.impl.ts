import { injectable, inject } from 'inversify';
import { BaseRepository } from './base.repository.impl';
import { IEventoRepository } from '../../domain/repositories/evento.repository';
import { Evento, TipoEvento } from '../../domain/entities/evento.entity';
import { IDatabase } from '../database/database';
import { TYPES } from '../ioc/types';

@injectable()
export class EventoRepository extends BaseRepository<Evento, string> implements IEventoRepository {
  constructor(@inject(TYPES.IDatabase) db: IDatabase) {
    super(db, 'eventos', 'id');
  }

  async findByEquipo(equipoId: string): Promise<Evento[]> {
    try {
      const query = 'SELECT * FROM eventos WHERE equipo_id = $1 ORDER BY fecha DESC';
      return await this.db.query<Evento>(query, [equipoId]);
    } catch (error) {
      console.error('Error al buscar eventos por equipo:', error);
      throw error;
    }
  }

  async findByCiudad(ciudadId: string): Promise<Evento[]> {
    try {
      const query = 'SELECT * FROM eventos WHERE ciudad_id = $1 ORDER BY fecha DESC';
      return await this.db.query<Evento>(query, [ciudadId]);
    } catch (error) {
      console.error('Error al buscar eventos por ciudad:', error);
      throw error;
    }
  }

  async findByTipo(tipo: TipoEvento): Promise<Evento[]> {
    try {
      const query = 'SELECT * FROM eventos WHERE tipo = $1 ORDER BY fecha DESC';
      return await this.db.query<Evento>(query, [tipo]);
    } catch (error) {
      console.error('Error al buscar eventos por tipo:', error);
      throw error;
    }
  }

  async findActivos(): Promise<Evento[]> {
    try {
      const query = 'SELECT * FROM eventos WHERE activo = true ORDER BY fecha DESC';
      return await this.db.query<Evento>(query);
    } catch (error) {
      console.error('Error al buscar eventos activos:', error);
      throw error;
    }
  }

  async findByFecha(fecha: Date): Promise<Evento[]> {
    try {
      // Convertir fecha a formato YYYY-MM-DD
      const fechaFormateada = fecha.toISOString().split('T')[0];
      
      const query = `
        SELECT * FROM eventos 
        WHERE DATE(fecha) = DATE($1)
        ORDER BY fecha DESC
      `;
      return await this.db.query<Evento>(query, [fechaFormateada]);
    } catch (error) {
      console.error('Error al buscar eventos por fecha:', error);
      throw error;
    }
  }

  async marcarInactivo(id: string): Promise<Evento> {
    try {
      const query = `
        UPDATE eventos
        SET activo = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await this.db.query<Evento>(query, [id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el evento con ID ${id}`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al marcar evento como inactivo:', error);
      throw error;
    }
  }
} 
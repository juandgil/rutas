import { IBaseRepository } from '../../domain/repositories/base.repository';
import { IDatabase } from '../database/database';
import { injectable } from 'inversify';

@injectable()
export abstract class BaseRepository<T, ID> implements IBaseRepository<T, ID> {
  constructor(
    protected db: IDatabase,
    protected tableName: string,
    protected pkColumn: string = 'id'
  ) {}

  async findById(id: ID): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${this.pkColumn} = $1`;
      const result = await this.db.query<T>(query, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error al buscar por ID en ${this.tableName}:`, error);
      throw error;
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const query = `SELECT * FROM ${this.tableName}`;
      return await this.db.query<T>(query);
    } catch (error) {
      console.error(`Error al buscar todos en ${this.tableName}:`, error);
      throw error;
    }
  }

  async create(entity: T): Promise<T> {
    try {
      const columns = Object.keys(entity as object).filter(key => key !== 'id');
      const values = columns.map(col => (entity as any)[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.db.query<T>(query, values);
      return result[0];
    } catch (error) {
      console.error(`Error al crear en ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id: ID, entity: Partial<T>): Promise<T> {
    try {
      const entries = Object.entries(entity as object);
      const columns = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
      const values = entries.map(([_, value]) => value);
      
      const query = `
        UPDATE ${this.tableName}
        SET ${columns}, updated_at = CURRENT_TIMESTAMP
        WHERE ${this.pkColumn} = $${values.length + 1}
        RETURNING *
      `;
      
      const result = await this.db.query<T>(query, [...values, id]);
      
      if (result.length === 0) {
        throw new Error(`No se encontró el registro con ID ${String(id)} en ${this.tableName}`);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error al actualizar en ${this.tableName}:`, error);
      throw error;
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${this.pkColumn} = $1`;
      await this.db.none(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error al eliminar de ${this.tableName}:`, error);
      throw error;
    }
  }
} 
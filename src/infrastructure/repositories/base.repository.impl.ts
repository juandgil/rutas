import { IBaseRepository } from '../../domain/repositories/base.repository';
import { IDatabase } from '../database/database';
import { injectable, unmanaged } from 'inversify';

/**
 * Función para convertir camelCase a snake_case
 */
function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Función para convertir objeto con propiedades en camelCase a objeto con propiedades en snake_case
 * y manejar correctamente los tipos especiales como arrays para columnas JSONB
 */
function convertToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    // Convertir camelCase a snake_case
    const snakeKey = camelToSnake(key);
    
    // Manejar casos especiales
    if (Array.isArray(obj[key])) {
      // Convertir arrays a JSON string para campos JSONB
      if (snakeKey === 'envios') {
        result[snakeKey] = JSON.stringify(obj[key]);
      } else {
        result[snakeKey] = obj[key];
      }
    } else {
      result[snakeKey] = obj[key];
    }
  });
  
  console.log('Conversión camelCase a snake_case:', { original: obj, convertido: result });
  return result;
}

@injectable()
export abstract class BaseRepository<T, ID> implements IBaseRepository<T, ID> {
  protected tableName: string;
  protected pkColumn: string;

  constructor(
    protected db: IDatabase,
    @unmanaged() tableName?: string,
    @unmanaged() pkColumn?: string
  ) {
    this.tableName = tableName ?? '';
    this.pkColumn = pkColumn ?? 'id';
  }

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
      // Convertir nombres de propiedades de camelCase a snake_case
      const snakeCaseEntity = convertToSnakeCase(entity as Record<string, any>);
      
      // No filtrar el id, ya que necesitamos incluirlo en la consulta SQL
      const columns = Object.keys(snakeCaseEntity);
      const values = columns.map(col => snakeCaseEntity[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      console.log('Query de inserción:', query);
      console.log('Valores:', values);
      
      const result = await this.db.query<T>(query, values);
      return result[0];
    } catch (error) {
      console.error(`Error al crear en ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id: ID, entity: Partial<T>): Promise<T> {
    try {
      // Convertir nombres de propiedades de camelCase a snake_case
      const snakeCaseEntity = convertToSnakeCase(entity as Record<string, any>);
      
      // Verificar si ya se incluye updated_at en la entidad
      const hasUpdatedAt = Object.keys(snakeCaseEntity).includes('updated_at');
      
      const entries = Object.entries(snakeCaseEntity);
      const columns = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
      const values = entries.map(([_, value]) => value);
      
      // Agregar updated_at solo si no está incluido en la entidad
      const updateClause = hasUpdatedAt 
        ? columns 
        : `${columns}, updated_at = CURRENT_TIMESTAMP`;
      
      console.log(`Generando consulta UPDATE para ${this.tableName}, columnas: ${columns}, tiene updated_at: ${hasUpdatedAt}`);
      
      const query = `
        UPDATE ${this.tableName}
        SET ${updateClause}
        WHERE ${this.pkColumn} = $${values.length + 1}
        RETURNING *
      `;
      
      console.log(`Consulta SQL generada: ${query}`);
      console.log(`Valores: ${JSON.stringify(values)} y ID: ${String(id)}`);
      
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
      await this.db.execute(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error al eliminar de ${this.tableName}:`, error);
      throw error;
    }
  }
} 
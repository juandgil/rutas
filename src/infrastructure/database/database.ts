import pgPromise from 'pg-promise';
import { injectable } from 'inversify';
import config from '../config/config';

// Inicializar pg-promise
const pgp = pgPromise();

// Configuración de la conexión
const dbConfig = {
  host: config.DB_HOST,
  port: Number(config.DB_PORT),
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  max: 30 // máximo número de clientes en el pool
};

// Diagnóstico: mostrar la configuración en desarrollo
if (config.NODE_ENV === 'development') {
  console.log('Configuración de base de datos:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    // No mostrar la contraseña por seguridad
  });
}

/**
 * Función para convertir nombres de columnas snake_case a camelCase
 */
function snakeToCamel(row: any): any {
  if (!row || typeof row !== 'object') return row;
  
  const result: any = {};
  
  Object.keys(row).forEach(key => {
    // Convertir snake_case a camelCase
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  });
  
  console.log('Conversión snake_case a camelCase:', { original: row, convertido: result });
  return result;
}

// Interfaz para la base de datos
export interface IDatabase {
  query<T>(query: string, params?: any[]): Promise<T[]>;
  execute(query: string, params?: any[]): Promise<void>;
  transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T>;
}

@injectable()
export class Database implements IDatabase {
  private db: any;

  constructor() {
    this.db = pgp(dbConfig);
  }

  async query<T>(query: string, params?: any[]): Promise<T[]> {
    try {
      const rows = await this.db.any(query, params);
      // Convertir nombres de columnas snake_case a camelCase
      return rows.map((row: any) => snakeToCamel(row) as T);
    } catch (error) {
      console.error('Error en la consulta a la BD:', error);
      throw error;
    }
  }

  async execute(query: string, params?: any[]): Promise<void> {
    try {
      return await this.db.none(query, params);
    } catch (error) {
      console.error('Error en la consulta a la BD:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T> {
    try {
      return await this.db.tx(async (t: any) => {
        const db = new Database();
        return await callback(db);
      });
    } catch (error) {
      console.error('Error en la transacción:', error);
      throw error;
    }
  }
} 
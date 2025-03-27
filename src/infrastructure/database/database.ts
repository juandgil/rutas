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

// Interfaz para la base de datos
export interface IDatabase {
  query<T>(text: string, params?: any[]): Promise<T[]>;
  one<T>(text: string, params?: any[]): Promise<T>;
  none(text: string, params?: any[]): Promise<void>;
}

@injectable()
export class Database implements IDatabase {
  private db: any;

  constructor() {
    this.db = pgp(dbConfig);
  }

  async query<T>(text: string, params?: any[]): Promise<T[]> {
    try {
      return await this.db.any(text, params);
    } catch (error) {
      console.error('Error en la consulta a la BD:', error);
      throw error;
    }
  }

  async one<T>(text: string, params?: any[]): Promise<T> {
    try {
      return await this.db.one(text, params);
    } catch (error) {
      console.error('Error en la consulta a la BD:', error);
      throw error;
    }
  }

  async none(text: string, params?: any[]): Promise<void> {
    try {
      return await this.db.none(text, params);
    } catch (error) {
      console.error('Error en la consulta a la BD:', error);
      throw error;
    }
  }
} 
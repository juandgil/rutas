import { createClient, RedisClientType } from 'redis';
import { injectable } from 'inversify';
import config from '../config/config';

export interface ICacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

@injectable()
export class RedisCache implements ICacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,
      password: config.REDIS_PASSWORD || undefined
    });

    this.client.on('error', (err) => {
      console.error('Error en la conexión a Redis:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Conectado a Redis');
      this.isConnected = true;
    });

    // Conectar al cliente de Redis al inicializar
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      console.error('Error al conectar a Redis:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      return await this.client.get(key);
    } catch (error) {
      console.error(`Error al obtener el valor para la clave ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl = 3600): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.set(key, value, { EX: ttl });
    } catch (error) {
      console.error(`Error al establecer el valor para la clave ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.del(key);
    } catch (error) {
      console.error(`Error al eliminar la clave ${key}:`, error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }
} 
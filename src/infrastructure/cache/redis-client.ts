import { injectable } from 'inversify';
import * as redis from 'redis';
import config from '../config/config';

// Interfaz común para servicios de caché
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

@injectable()
export class RedisCache implements ICacheService {
  private client: redis.RedisClientType | null = null;
  private memoryCache: Map<string, { value: any, expiry?: number }> = new Map();
  private useMemoryCache: boolean = false; // Usamos Redis por defecto
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (this.useMemoryCache) {
        console.log('Usando caché en memoria (modo fallback)');
        return;
      }

      if (this.isConnecting) {
        console.log('Ya hay una conexión en progreso...');
        return;
      }

      this.isConnecting = true;
      console.log(`Conectando a Redis en ${config.REDIS_HOST}:${config.REDIS_PORT}...`);
      
      this.client = redis.createClient({
        socket: {
          host: config.REDIS_HOST,
          port: Number(config.REDIS_PORT),
          reconnectStrategy: (retries) => {
            if (retries > this.MAX_RECONNECT_ATTEMPTS) {
              console.error(`Máximo número de reintentos (${this.MAX_RECONNECT_ATTEMPTS}) alcanzado. Cambiando a caché en memoria.`);
              this.useMemoryCache = true;
              return false; // No más reintentos
            }
            const delay = Math.min(retries * 500, 3000);
            console.log(`Reintentando conexión a Redis en ${delay}ms (intento ${retries})...`);
            return delay;
          },
          connectTimeout: 5000, // 5 segundos máximo de espera
        },
        password: config.REDIS_PASSWORD || undefined
      });

      // Manejo de eventos
      this.client.on('error', (err) => {
        console.error('Error en la conexión Redis:', err);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
          console.error('Demasiados errores de Redis. Cambiando a caché en memoria...');
          this.useMemoryCache = true;
        }
      });

      this.client.on('connect', () => {
        console.log('Conectando a Redis...');
      });

      this.client.on('ready', () => {
        console.log('Redis está listo para usarse');
        this.reconnectAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        console.log('Reconectando a Redis...');
      });

      this.client.on('end', () => {
        console.log('Conexión a Redis cerrada');
      });

      await this.client.connect();
      console.log('Conexión a Redis establecida correctamente');
      this.isConnecting = false;
    } catch (error) {
      console.error('Error al inicializar Redis:', error);
      console.log('Cambiando a caché en memoria como fallback...');
      this.useMemoryCache = true;
      this.isConnecting = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useMemoryCache) {
      return this.getFromMemory<T>(key);
    }

    try {
      if (!this.client) {
        console.error('Cliente Redis no inicializado');
        return null;
      }

      const value = await this.client.get(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error al obtener clave ${key} de Redis:`, error);
      return this.getFromMemory<T>(key); // Fallback a memoria si hay error
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (this.useMemoryCache) {
      this.setInMemory(key, value, ttlSeconds);
      return;
    }

    try {
      if (!this.client) {
        console.error('Cliente Redis no inicializado');
        this.setInMemory(key, value, ttlSeconds);
        return;
      }

      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.error(`Error al guardar clave ${key} en Redis:`, error);
      this.setInMemory(key, value, ttlSeconds); // Fallback a memoria si hay error
    }
  }

  async del(key: string): Promise<void> {
    if (this.useMemoryCache) {
      this.memoryCache.delete(key);
      return;
    }

    try {
      if (!this.client) {
        console.error('Cliente Redis no inicializado');
        this.memoryCache.delete(key);
        return;
      }

      await this.client.del(key);
    } catch (error) {
      console.error(`Error al eliminar clave ${key} de Redis:`, error);
      this.memoryCache.delete(key); // Fallback a memoria si hay error
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.useMemoryCache) {
      return this.existsInMemory(key);
    }

    try {
      if (!this.client) {
        console.error('Cliente Redis no inicializado');
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error al verificar existencia de clave ${key} en Redis:`, error);
      return this.existsInMemory(key); // Fallback a memoria si hay error
    }
  }

  // Implementación de caché en memoria para fallback
  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Verificar si ha expirado
    if (item.expiry && item.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  private setInMemory(key: string, value: any, ttlSeconds?: number): void {
    const item = {
      value,
      expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined
    };
    
    this.memoryCache.set(key, item);
  }

  private existsInMemory(key: string): boolean {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Verificar si ha expirado
    if (item.expiry && item.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return false;
    }
    
    return true;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
} 
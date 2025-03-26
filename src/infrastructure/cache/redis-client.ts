import { injectable } from 'inversify';
import * as redis from 'redis';

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
  private useMemoryCache: boolean = true; // Siempre usar caché en memoria para desarrollo

  constructor() {
    console.log('Usando caché en memoria para desarrollo...');
  }

  async get<T>(key: string): Promise<T | null> {
    return this.getFromMemory<T>(key);
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    this.setInMemory(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.existsInMemory(key);
  }

  // Implementación de caché en memoria
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
} 
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Determinar qué archivo .env cargar según el entorno
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env'
  : fs.existsSync(path.resolve(process.cwd(), '.env.local'))
    ? '.env.local'
    : '.env';

// Cargar el archivo correspondiente
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(`Cargando configuración desde ${envFile} para entorno ${process.env.NODE_ENV ?? 'development'}`);

// Exportar variables de entorno con valores por defecto
export const env = {
  // Servidor
  PORT: parseInt(process.env.PORT ?? '3000'),
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  // Base de datos
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT ?? '5432'),
  DB_NAME: process.env.DB_NAME ?? 'rutas_db',
  DB_USER: process.env.DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '123456',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT ?? '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? '',
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true' || false,
  USE_MEMORY_CACHE: process.env.USE_MEMORY_CACHE === 'true' || false,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET ?? 'default_secret_key_for_development_only',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '24h',

  // PubSub
  PUBSUB_TOPIC: process.env.PUBSUB_TOPIC ?? 'eventos-rutas',
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID ?? 'local-dev-project',
  
  // Cache
  CACHE_ENABLED: process.env.CACHE_ENABLED === 'true' || true,
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS ?? '3600'),
  
  // Circuit Breaker
  PUBSUB_ENABLED: process.env.PUBSUB_ENABLED === 'true' || true,
  CIRCUIT_BREAKER_FAILURES: parseInt(process.env.CIRCUIT_BREAKER_FAILURES ?? '3'),
  CIRCUIT_BREAKER_RESET_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ?? '30000'),
  
  // Modo de alta carga
  HIGH_LOAD_MODE: process.env.HIGH_LOAD_MODE === 'true' || false,
  
  // Logs
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info'
}; 
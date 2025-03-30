/**
 * Configuración centralizada de la aplicación
 * Los valores se obtienen de variables de entorno o valores por defecto
 */
export default {
  // Entorno
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Servidor
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  
  // Base de datos
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  DB_NAME: process.env.DB_NAME || 'rutas_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '123456',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'rutas-optimizacion-secret-dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Google Cloud
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'rutas-optimizacion-dev',
  
  // Cache
  CACHE_ENABLED: process.env.CACHE_ENABLED === 'true',
  CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS ? parseInt(process.env.CACHE_TTL_SECONDS) : 300,
  
  // PubSub
  PUBSUB_ENABLED: process.env.PUBSUB_ENABLED !== 'false',
  
  // Resiliencia
  CIRCUIT_BREAKER_FAILURES: process.env.CIRCUIT_BREAKER_FAILURES ? parseInt(process.env.CIRCUIT_BREAKER_FAILURES) : 3,
  CIRCUIT_BREAKER_RESET_TIMEOUT: process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ? parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) : 30000,
  
  // Modo de alta carga
  HIGH_LOAD_MODE: process.env.HIGH_LOAD_MODE === 'true'
}; 
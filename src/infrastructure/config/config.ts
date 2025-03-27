// Asegurarnos de cargar las variables de entorno
import * as dotenv from 'dotenv';
dotenv.config();

// Diagnóstico para desarrollo
console.log('Configuración DB_PORT:', process.env.DB_PORT);

// Configuraciones de la aplicación
export default {
  // Servidor
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Base de datos
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5433', 10), // Valor por defecto cambiado a 5433 y forzado a número
  DB_NAME: process.env.DB_NAME || 'rutas_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  // Redis (para caché)
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'tu_secreto_seguro',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // PubSub (simulado para este proyecto)
  PUBSUB_TOPIC: process.env.PUBSUB_TOPIC || 'eventos-rutas',

  // Log
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}; 
// Cargar variables de entorno al inicio
import * as dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import { createApp } from './infrastructure/express/app';
import { env } from './infrastructure/config/env';

const startServer = async () => {
  try {
    const app = createApp();
    const port = parseInt(env.PORT || '3000', 10);

    // Iniciar servidor
    app.listen(port, () => {
      console.log(`Servidor iniciado en puerto ${port}`);
      console.log(`Entorno: ${env.NODE_ENV}`);
      console.log(`Base de datos: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
      if (env.REDIS_ENABLED === 'true') {
        console.log(`Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
      }
      console.log(`Documentación: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer(); 
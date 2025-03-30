// Cargar variables de entorno al inicio
import * as dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import { App } from './infrastructure/express/app';
import { env } from './infrastructure/config/env';

// Forzar la carga de todos los controladores
import './interfaces/controllers';

// Iniciar el servidor
const port = process.env.PORT || 3000;
const app = new App();
app.inicializar().then(() => {
  app.escuchar(Number(port), () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
    console.log(`Entorno: ${env.NODE_ENV}`);
    console.log(`Base de datos: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
    if (env.REDIS_ENABLED) {
      console.log(`Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
    }
    console.log(`Documentación: http://localhost:${port}/api-docs`);
  });
}).catch(error => {
  console.error('Error al inicializar la aplicación:', error);
  process.exit(1);
}); 
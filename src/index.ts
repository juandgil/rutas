// Cargar variables de entorno al inicio
import * as dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as express from 'express';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cors from 'cors';

// Importar contenedor IoC
import { container } from './infrastructure/ioc/container';

// Importar configuración de Swagger
import { setupSwagger } from './infrastructure/swagger';

// Bootstrap de la aplicación
const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  // Configuración de middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configurar CORS usando el paquete cors
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  }));

  // Configurar logging
  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true,
  }));

  // Configurar Swagger para documentación de API
  setupSwagger(app);
});

// Capturar errores globales
server.setErrorConfig((app) => {
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      error: err.message || 'Error interno del servidor'
    });
  });
});

const app = server.build();
const PORT = process.env.PORT || 3000;

// Solo iniciar el servidor si este archivo se ejecuta directamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`Documentación de API disponible en http://localhost:${PORT}/api-docs`);
  });
}

export default app; 
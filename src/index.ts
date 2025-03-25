import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as express from 'express';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import * as swaggerUi from 'swagger-ui-express';

// Importar contenedor IoC (se creará después)
import { container } from './infrastructure/ioc/container';

// Bootstrap de la aplicación
const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  // Configuración de middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
  const swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'API de Optimización de Rutas',
      version: '1.0.0',
      description: 'API para optimización de rutas de entrega en tiempo real'
    },
    // Las rutas se agregarán más adelante
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Documentación de API disponible en http://localhost:${PORT}/api-docs`);
});

export default app; 
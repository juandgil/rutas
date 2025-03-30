import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { InversifyExpressServer } from 'inversify-express-utils';
import { container } from '../ioc/container';
import { env } from '../config/env';
import { authMiddlewareExpress } from '../../interfaces/middleware/auth-middleware';
import { setupSwagger } from '../swagger';
import { PubSubMessageHandlers } from '../pubsub/message-handlers';
import { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { TYPES } from '../ioc/types';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';

// Importar todos los controladores
import '../../interfaces/controllers';
import '../../interfaces/controllers/auth.controller';
import '../../interfaces/controllers/rutas.controller';

export class App {
  private app: Application;
  private inversifyServer: InversifyExpressServer;

  constructor() {
    this.inversifyServer = new InversifyExpressServer(container, null, {
      rootPath: '/api'
    });

    this.inversifyServer.setConfig((app) => {
      // Configuración básica
      app.use(cors());
      app.use(helmet());
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(morgan('dev'));

      // Configuración de Swagger
      setupSwagger(app);

      // Middleware de autenticación (excepto rutas públicas)
      app.use((req, res, next) => {
        // Rutas públicas que no requieren autenticación
        const publicRoutes = [
          '/api/auth/login',
          '/api-docs',
          '/swagger.json'
        ];

        const isPublicRoute = publicRoutes.some(route => 
          req.path.startsWith(route) || req.path === '/'
        );

        if (isPublicRoute) {
          return next();
        }

        // Aplicar middleware de autenticación para rutas protegidas
        return authMiddleware(req, res, next);
      });
    });

    this.inversifyServer.setErrorConfig((app) => {
      // Middleware de manejo de errores global
      app.use(errorMiddleware);
    });

    this.app = this.inversifyServer.build();
  }

  public async inicializar(): Promise<void> {
    try {
      // Inicializar servicio PubSub
      const pubSubService = container.get<IPubSubService>(TYPES.IPubSubService);
      await pubSubService.inicializar();
      console.log('Servicio PubSub inicializado correctamente');
      
      // Inicializar los handlers de PubSub (esto automáticamente crea las suscripciones)
      await container.get<PubSubMessageHandlers>(TYPES.PubSubMessageHandlers);
      console.log('Manejadores de mensajes PubSub inicializados correctamente');
    } catch (error: any) {
      console.error('Error al inicializar servicios asíncronos:', error);
    }
  }

  public escuchar(port: number, callback?: () => void): void {
    this.app.listen(port, () => {
      console.log(`Servidor iniciado en el puerto ${port}`);
      console.log(`Documentación de la API disponible en http://localhost:${port}/api-docs`);
      if (callback) callback();
    });
  }

  public getApp(): Application {
    return this.app;
  }
} 
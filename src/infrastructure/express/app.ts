import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { InversifyExpressServer } from 'inversify-express-utils';
import { container } from '../ioc/container';
import { env } from '../config/env';
import { authMiddlewareExpress } from '../../interfaces/middleware/auth-middleware';
import { setupSwagger } from '../swagger';

// Importar todos los controladores
import '../../interfaces/controllers';

export const createApp = () => {
  // Crear servidor Express con Inversify
  const server = new InversifyExpressServer(container);

  server.setConfig((app) => {
    // Middlewares básicos
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Configurar Swagger
    setupSwagger(app);

    // Aplicar middleware de autenticación a todas las rutas excepto /api/auth/login
    app.use((req, res, next) => {
      // Rutas públicas que no requieren autenticación
      const publicRoutes = [
        '/api/auth/login',
        '/api-docs',
        '/swagger',
        '/swagger-ui'
      ];

      // Verificar si la ruta actual está en la lista de rutas públicas
      const isPublicRoute = publicRoutes.some(route => 
        req.path === route || 
        req.path.startsWith('/api-docs/') || 
        req.path.startsWith('/swagger-ui/')
      );

      if (isPublicRoute) {
        return next();
      }

      // Aplicar middleware de autenticación para rutas protegidas
      authMiddlewareExpress()(req, res, next);
    });
  });

  server.setErrorConfig((app) => {
    // Middleware para manejo de errores
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error en la aplicación:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        data: null
      });
    });
  });

  // Construir la aplicación
  const app = server.build();

  // Configurar el puerto
  const port = env.PORT;
  app.set('port', port);

  return app;
}; 
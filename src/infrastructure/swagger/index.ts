import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config';

/**
 * Configura Swagger en la aplicación Express
 * @param app Aplicación Express
 */
export const setupSwagger = (app: Application) => {
  // Ruta para la documentación de la API
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Endpoint para obtener el archivo swagger.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger configurado: /api-docs');
}; 
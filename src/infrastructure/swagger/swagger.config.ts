import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Opciones de configuración para Swagger
 */
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Optimización de Rutas',
      version: '1.0.0',
      description: 'API RESTful para la optimización de rutas de entrega en tiempo real',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      contact: {
        name: 'Juan david gil',
        email: 'juandavidgilalvarez@gmail.com'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/interfaces/controllers/**/*.ts',
    './src/domain/entities/**/*.ts',
    './src/domain/dtos/**/*.ts'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerSpec }; 
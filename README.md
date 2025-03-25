# Sistema de Optimización de Rutas

API para la optimización de rutas de entrega en tiempo real para una empresa de logística.

## Características

- API RESTful desarrollada con Node.js y TypeScript
- Arquitectura limpia (Clean Architecture) con principios SOLID
- Autenticación segura con JWT
- Caching con Redis para optimización de rendimiento
- Manejo de eventos asíncronos con Pub/Sub
- Pruebas unitarias y de integración con Jest
- Documentación de API con Swagger

## Requisitos previos

- Node.js 16.x o superior
- PostgreSQL
- Redis
- Docker (opcional para contenedores)

## Instalación

1. Clonar el repositorio:
```
git clone https://github.com/your-username/rutas.git
cd rutas
```

2. Instalar dependencias:
```
npm install
```

3. Configurar las variables de entorno (crear un archivo .env):
```
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rutas_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=tu_secreto_seguro
JWT_EXPIRES_IN=24h
```

4. Compilar el proyecto:
```
npm run build
```

5. Iniciar el servidor:
```
npm start
```

## Scripts disponibles

- `npm start`: Inicia la aplicación en modo producción.
- `npm run dev`: Inicia la aplicación en modo desarrollo.
- `npm run build`: Compila el proyecto.
- `npm test`: Ejecuta las pruebas.
- `npm run test:watch`: Ejecuta las pruebas en modo watch.
- `npm run test:coverage`: Ejecuta las pruebas con cobertura.

## Arquitectura

Este proyecto sigue los principios de Clean Architecture:

- **Domain**: Contiene las entidades y reglas de negocio.
- **Application**: Contiene los casos de uso de la aplicación.
- **Infrastructure**: Contiene implementaciones concretas (base de datos, servicios externos).
- **Interfaces**: Contiene controladores, middlewares y presentadores.

## API Endpoints

- `POST /api/auth/login`: Autenticación de usuarios
- `GET /api/rutas/optimizar/:equipoId`: Calcula la ruta óptima para un equipo
- `PUT /api/rutas/replanificar/:equipoId`: Replanifica la ruta para un equipo
- `POST /api/eventos`: Registra un nuevo evento inesperado

La documentación completa de la API está disponible en `/api-docs` cuando el servidor está en ejecución.
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

## Flujo de Trabajo Diario

El Sistema de Optimización de Rutas está diseñado para mejorar la eficiencia operativa día a día. A continuación se detalla el flujo de trabajo típico:

### 1. Inicio de la Jornada (6:00 - 8:00 AM)

#### Autenticación de Usuarios
Los diferentes roles acceden al sistema:
- **Operadores del Centro de Control**: Monitorean todas las rutas y eventos
- **Transportistas**: Reciben y ejecutan las rutas asignadas
- **Administradores**: Supervisan el desempeño general del sistema

```bash
POST /api/auth/login
```

#### Generación de Rutas Optimizadas
El sistema calcula las rutas óptimas considerando:
- Pedidos pendientes del día
- Condiciones actuales de tráfico
- Pronóstico del clima
- Prioridad según SLAs de clientes
- Capacidad y disponibilidad de vehículos

```bash
GET /api/rutas/optimizar/:equipoId
```

### 2. Operación en Curso (8:00 AM - 5:00 PM)

#### Monitoreo Continuo
El centro de control monitorea constantemente:
- Eventos activos que podrían afectar las entregas
- Ubicación GPS de los equipos de transporte
- Progreso de las entregas vs. tiempos estimados

```bash
GET /api/eventos/activos
GET /api/eventos/ciudad/:ciudadId
GET /api/eventos/equipo/:equipoId
```

#### Gestión de Eventos Inesperados
Cuando ocurre un imprevisto (accidente, bloqueo vial, etc.):
1. Los transportistas o el centro de control registran el evento
2. El sistema evalúa el impacto en las rutas afectadas
3. Se generan alertas para los equipos potencialmente afectados

```bash
POST /api/eventos
{
  "tipo": "TRAFICO",
  "descripcion": "Cierre vial por manifestación",
  "latitud": 4.6782,
  "longitud": -74.0582,
  "ciudadId": "bogota",
  "equipoId": "eq-001",  // Opcional
  "impacto": "ALTO",
  "metadatos": { ... }
}
```

#### Replanificación Dinámica
Cuando un evento afecta significativamente una ruta:
1. Se solicita replanificación para el equipo afectado
2. El sistema recalcula la ruta óptima desde la ubicación actual
3. Se priorizan entregas según los SLAs y nuevas condiciones
4. Se actualizan los tiempos estimados de entrega

```bash
PUT /api/rutas/replanificar/:equipoId
```

### 3. Cierre y Análisis (5:00 - 7:00 PM)

#### Desactivación de Eventos
Se marcan como inactivos los eventos resueltos:

```bash
PUT /api/eventos/:id/inactivar
```

#### Análisis de Desempeño
El sistema genera reportes de:
- Cumplimiento de SLAs
- Eficiencia de las rutas (distancia, tiempo, combustible)
- Impacto de eventos en la operación
- Desempeño de equipos de transporte

### Tecnologías en Acción

Durante todo el flujo operativo:

- **APIs Externas Simuladas**: Proporcionan datos realistas de GPS, tráfico, clima y vehículos
- **Caché Inteligente**: Optimiza el rendimiento al almacenar datos frecuentemente consultados
- **Sistema PubSub**: Permite notificaciones en tiempo real a todos los componentes del sistema
- **Autenticación JWT**: Garantiza un acceso seguro a las funcionalidades según el rol del usuario
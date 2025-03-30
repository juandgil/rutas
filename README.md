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
- Resiliencia con Circuit Breaker y estrategias de fallback

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

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=tu-proyecto-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Configuración de carga
HIGH_LOAD_MODE=false  # Establecer en true para procesamiento asíncrono de todas las operaciones

# Circuit Breaker
CIRCUIT_BREAKER_MAX_FAILURES=5
CIRCUIT_BREAKER_RESET_TIMEOUT=30000  # milisegundos
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

### Capas de la Arquitectura

- **Domain**: Contiene las entidades y reglas de negocio.
  - Entidades como Ruta, Evento, Envío
  - Interfaces de repositorios
  - Reglas de negocio independientes de frameworks

- **Application**: Contiene los casos de uso de la aplicación.
  - Servicios de aplicación
  - Coordinación entre entidades
  - DTOs (Objetos de transferencia de datos)
  - Interfaces de servicios externos

- **Infrastructure**: Contiene implementaciones concretas.
  - Implementaciones de repositorios
  - Servicios de caché
  - Integraciones con APIs externas
  - Implementación de PubSub
  - Configuración de la base de datos

- **Interfaces**: Contiene interfaces de usuario y API.
  - Controladores REST
  - Middlewares
  - Validaciones de entrada
  - Transformación de datos para presentación

### Principios SOLID

El sistema está diseñado siguiendo los principios SOLID:

1. **Principio de Responsabilidad Única (S)**
   - Cada clase tiene una única responsabilidad
   - Ejemplo: El servicio de optimización solo se encarga de calcular rutas, no gestiona eventos

2. **Principio de Abierto/Cerrado (O)**
   - Las entidades están abiertas para extensión pero cerradas para modificación
   - Ejemplo: Nuevos tipos de eventos pueden agregarse sin modificar el código existente

3. **Principio de Sustitución de Liskov (L)**
   - Las clases derivadas pueden sustituir a sus clases base
   - Ejemplo: Todas las implementaciones de repositorios pueden usarse donde se espera la interfaz base

4. **Principio de Segregación de Interfaces (I)**
   - Interfaces específicas son mejores que una sola interfaz general
   - Ejemplo: Separación entre repositorios de diferentes entidades

5. **Principio de Inversión de Dependencias (D)**
   - Dependencia de abstracciones, no de implementaciones concretas
   - Ejemplo: Los servicios dependen de interfaces de repositorios, no de implementaciones concretas

### Patrones de Diseño

El sistema implementa varios patrones de diseño:

- **Singleton**: Para servicios compartidos como Cache y PubSub
- **Repository**: Para abstraer el acceso a datos
- **Dependency Injection**: Para desacoplar componentes y facilitar pruebas
- **Circuit Breaker**: Para mejorar la resiliencia en llamadas a servicios externos
- **Strategy**: Para diferentes algoritmos de optimización de rutas
- **Observer**: A través del sistema PubSub para notificaciones

## Estrategia de Resiliencia

### Circuit Breaker

- Protege el sistema contra fallos en servicios externos
- Reduce la carga en servicios que están fallando
- Proporciona respuestas alternativas cuando un servicio no está disponible

### Procesamiento Asíncrono con PubSub

- Reduce el acoplamiento entre componentes
- Permite manejo de cargas altas durante picos de tráfico
- Mejora la tolerancia a fallos y la escalabilidad

### Caché en Múltiples Niveles

- Redis para datos compartidos entre instancias
- Caché en memoria para datos de acceso muy frecuente
- Estrategia de fallback a caché cuando los servicios externos fallan

## Estrategia de Escalabilidad en Cloud Run (GCP)

Para un despliegue en producción, se recomienda la siguiente configuración en Google Cloud Platform:

### Cloud Run

- **Autoscaling**: Configurar para escalar automáticamente de 2 a 100 instancias
- **Memoria**: 2GB mínimo por instancia para cálculos de optimización
- **CPU**: 1 CPU por instancia, con burst hasta 2 CPUs
- **Concurrencia**: 80 solicitudes concurrentes por instancia
- **Timeout**: 5 minutos para operaciones de optimización complejas

### Cloud SQL (PostgreSQL)

- Configuración: 4 CPUs, 16GB RAM, SSD de alto rendimiento
- Alta disponibilidad con réplica standby
- Réplicas de lectura para consultas frecuentes
- Estrategia de particionamiento por fecha para datos históricos
- Backups automáticos y point-in-time recovery

### Pub/Sub

La implementación actual utiliza Google Cloud Pub/Sub con los siguientes temas:

1. **gps-updates**: Para procesamiento asíncrono de actualizaciones GPS
   - Alta frecuencia de mensajes
   - Procesamiento ligero por mensaje

2. **route-optimizations**: Para cálculos de optimización de rutas
   - Procesamiento intensivo
   - Resultados retornados vía notificaciones

3. **delivery-events**: Para eventos relacionados con entregas
   - Notificaciones a sistemas externos
   - Actualización de estados

4. **traffic-conditions**: Para actualizaciones de condiciones de tráfico
   - Actualizaciones periódicas
   - Distribución a múltiples consumidores

5. **weather-alerts**: Para alertas climáticas que afectan operaciones
   - Baja frecuencia, alta prioridad
   - Distribución a múltiples sistemas

### Redis (Memorystore)

- Instancia dedicada con 5GB de memoria
- Habilitación de persistencia
- Conexión mediante VPC privada
- Configuración de alta disponibilidad

## API Endpoints

### Autenticación
- `POST /api/auth/login`: Autenticación de usuarios

### Rutas
- `GET /api/rutas/optimizar/:equipoId`: Calcula la ruta óptima para un equipo
- `PUT /api/rutas/replanificar/:equipoId`: Replanifica la ruta para un equipo

### Eventos
- `POST /api/eventos`: Registra un nuevo evento inesperado
- `GET /api/eventos/activos`: Obtiene los eventos activos
- `PUT /api/eventos/:id/inactivar`: Marca un evento como inactivo

### GPS
- `GET /api/gps/ubicacion/:equipoId`: Obtiene la ubicación actual de un equipo
- `GET /api/gps/historico/:equipoId`: Obtiene el historial de ubicaciones GPS de un equipo
- `POST /api/gps/ubicacion`: Registra una nueva ubicación GPS para un equipo

### Tráfico y Clima
- `GET /api/trafico-clima/trafico/:ciudadId`: Obtiene condiciones de tráfico para una ciudad
- `GET /api/trafico-clima/clima/:ciudadId`: Obtiene condiciones climáticas para una ciudad
- `POST /api/trafico-clima/impacto`: Calcula el impacto de las condiciones en una ruta

### Vehículos
- `GET /api/vehiculos/:id`: Obtiene información detallada de un vehículo
- `GET /api/vehiculos`: Obtiene lista de vehículos

La documentación completa de la API está disponible en `/api-docs` cuando el servidor está en ejecución.

## Documentación de API con Swagger

El sistema utiliza Swagger para proporcionar documentación interactiva de todas las APIs disponibles. Para acceder a esta documentación:

1. Inicia la aplicación con `npm run dev`
2. Navega a `http://localhost:3000/api-docs` en tu navegador

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

## Pruebas

Para ejecutar las pruebas, asegúrate de que el servidor no esté en ejecución y utiliza el siguiente comando:

```bash
npm test
```

Para ejecutar una prueba específica:

```bash
npx jest ruta/al/archivo.test.ts
```

Para ejecutar las pruebas en modo observador (se vuelven a ejecutar cuando cambian los archivos):

```bash
npm run test:watch
```

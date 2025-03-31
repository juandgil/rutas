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
- `POST /api/rutas/optimizar-masivo/:ciudadId`: Optimiza rutas para todos los equipos disponibles en una ciudad

### Eventos
- `POST /api/eventos`: Registra un nuevo evento inesperado
- `GET /api/eventos/activos`: Obtiene los eventos activos
- `PUT /api/eventos/:id/inactivar`: Marca un evento como inactivo

### GPS

- `POST /api/gps/sincronizar_ubicacion`: Sincroniza las ubicaciones actuales de todos los equipos desde los registros GPS (ejecutado automáticamente por Cloud Scheduler cada 5 minutos usando la expresión cron `0 */5 * * *`)
- `POST /api/gps/generar_datos_prueba`: Genera datos de prueba para simular ubicaciones GPS (solo en entorno de desarrollo)

### Tráfico y Clima
- `GET /api/trafico-clima/trafico/:ciudadId`: Obtiene condiciones de tráfico para una ciudad
- `GET /api/trafico-clima/clima/:ciudadId`: Obtiene condiciones climáticas para una ciudad
- `GET /api/trafico-clima/evaluacion/:ciudadId`: Obtiene una evaluación general de las condiciones en una ciudad
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
  "equipoId": "equipo-001",  // Opcional
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

## Algoritmos de Optimización de Rutas

El sistema implementa algoritmos avanzados para la planificación y optimización de rutas de entrega, utilizando técnicas adaptadas para resolver problemas complejos de logística y transporte en tiempo real.

### Algoritmo del Vecino Más Cercano

Este algoritmo es utilizado para optimizar el orden de entrega de los envíos seleccionados:

1. **Punto de inicio**: Comienza en la ubicación actual del equipo (obtenida de la tabla `equipos_ubicacion_actual`)
2. **Proceso iterativo**:
   - Calcula la distancia desde la ubicación actual a todos los envíos pendientes
   - Selecciona el envío más cercano
   - Se mueve a esa ubicación
   - Marca el envío como visitado
   - Repite hasta visitar todos los envíos
3. **Complejidad**: O(n²) donde n es el número de envíos
4. **Consideraciones**:
   - No necesariamente encuentra la ruta óptima global (problema del viajante)
   - Ofrece buen balance entre calidad de solución y rendimiento
   - Funciona bien para distribución geográfica típica de envíos urbanos
   - La ubicación actual proviene de datos GPS almacenados en la tabla `equipos_ubicacion_actual`, que se actualiza cada 5 horas

### Algoritmo de Asignación de Envíos a Vehículos

Para determinar qué envíos asignar a cada vehículo, el sistema utiliza un algoritmo de optimización de carga:

1. **Factores considerados**:
   - Capacidad del vehículo (peso y volumen máximos)
   - Prioridad de los envíos según SLA
   - Distancia y tiempo estimado de entrega
   - Condiciones de tráfico y clima

2. **Proceso de selección**:
   - Calcula un puntaje para cada envío basado en:
     - Prioridad del SLA (menor número = mayor prioridad)
     - Distancia hasta el destino
     - Impacto de las condiciones actuales de tráfico y clima
   - Ordena los envíos por puntaje (menor es mejor - más prioritario)
   - Selecciona envíos hasta completar la capacidad del vehículo

3. **Consideraciones de eficiencia**:
   - Maximiza el uso de la capacidad del vehículo
   - Optimiza distancia y tiempo de la ruta completa
   - Balance entre priorización de SLAs y eficiencia de ruta

## Arquitectura de Planificación y Replanificación

### Proceso de Planificación de Rutas

El endpoint `GET /api/rutas/optimizar/:equipoId` implementa un proceso completo de planificación que:

1. **Recopila información relevante**:
   - Obtiene datos del equipo y vehículo
   - Verifica disponibilidad del vehículo
   - Consulta ubicación actual del equipo
   - Obtiene envíos pendientes en la ciudad

2. **Implementa lógica de negocio**:
   - Filtra envíos compatibles con capacidad del vehículo
   - Aplica algoritmo de selección de envíos
   - Optimiza orden de entrega
   - Calcula distancia total y tiempo estimado

3. **Notifica asíncronamente**:
   - Publica el resultado en un tema de Pub/Sub
   - Permite que sistemas interesados sean notificados

### Procesamiento Asíncrono con PubSub

El sistema utiliza Google Cloud Pub/Sub por varias razones clave:

1. **Desacoplamiento de componentes**:
   - El servicio de optimización publica los resultados
   - Otros componentes se suscriben independientemente
   - Reduce interdependencias directas entre servicios

2. **Resiliencia mejorada**:
   - La comunicación asíncrona permite reintento de operaciones
   - El sistema continúa funcionando incluso si algunos componentes fallan
   - Los mensajes se persisten hasta que sean procesados correctamente

3. **Escalabilidad horizontal**:
   - Permite escalar componentes independientemente
   - Soporta picos de carga distribuyendo el procesamiento
   - Múltiples instancias pueden procesar mensajes en paralelo

### Replanificación Dinámica

El endpoint `PUT /api/rutas/replanificar/:equipoId` proporciona capacidades de replanificación en tiempo real:

1. **Respuesta a eventos inesperados**:
   - Recibe el ID del evento que causa la replanificación
   - Verifica que el evento esté activo y afecte la ruta
   - Asegura que no se replanifique múltiples veces por el mismo evento

2. **Recálculo inteligente**:
   - Comienza desde la ubicación actual del equipo
   - Considera solo envíos no entregados
   - Incorpora condiciones actualizadas de tráfico y clima
   - Ajusta prioridades según el tipo de evento

3. **Optimización de costos operativos**:
   - Minimiza las desviaciones innecesarias
   - Prioriza SLAs en riesgo
   - Equilibra eficiencia con servicio al cliente

### Optimización Masiva

El endpoint `POST /api/rutas/optimizar-masivo/:ciudadId` permite planificar rutas para todos los equipos disponibles en una ciudad:

1. **Procesamiento por lotes**:
   - Identifica todos los equipos disponibles en la ciudad
   - Obtiene todos los envíos pendientes sin asignar
   - Procesa cada equipo secuencialmente

2. **Distribución eficiente**:
   - Asigna envíos considerando la capacidad de cada vehículo
   - Optimiza globalmente para minimizar distancia total
   - Prioriza envíos según SLAs

3. **Tolerancia a fallos**:
   - Maneja errores individuales sin interrumpir el proceso completo
   - Continúa con el siguiente equipo si ocurre un error
   - Reporta resultados parciales si no todos los equipos pueden ser optimizados

### Integración con APIs Externas

El sistema utiliza APIs externas para mejorar la calidad de las decisiones:

1. **API de Tráfico y Clima**:
   - Proporciona datos en tiempo real sobre condiciones de tráfico
   - Informa sobre condiciones climáticas que pueden afectar las entregas
   - Calcula factores de ajuste para tiempos estimados

2. **API de GPS**:
   - Obtiene ubicaciones actualizadas de equipos
   - Rastrea progreso de las entregas
   - Permite replanificación desde ubicación real

3. **API de Vehículos**:
   - Verifica disponibilidad de vehículos
   - Obtiene capacidades actualizadas
   - Monitorea estado de mantenimiento

Estos servicios externos están integrados con patrones de resiliencia (Circuit Breaker) y estrategias de fallback para garantizar el funcionamiento incluso cuando los servicios externos presentan problemas.

## Diagramas de Secuencia de Endpoints Principales

A continuación se describen los flujos de ejecución de los endpoints principales del sistema, detallando las entradas, procesamiento interno, servicios utilizados, tablas de base de datos y salidas.

### Autenticación: POST /api/auth/login

**Flujo de Secuencia:**
```
Cliente → AuthController.login() → AuthService.login() → [Validación de credenciales] → AuthService.generateToken() → Cliente
```

**Detalles:**
1. **Entrada:** `{ username: string, password: string }`
2. **Procesamiento:**
   - Valida formato con `LoginRequestDto.validationSchema`
   - Autentica contra usuarios (en producción: tabla `usuarios`)
3. **Servicios:** `AuthService`
4. **Salida:** `{ token: string, expiresIn: number }`

### Planificación de Rutas: GET /api/rutas/optimizar/:equipoId

**Flujo de Secuencia:**
```
Cliente → RutasController.optimizarRuta() → EquipoRepository.findById() → 
PubSubService.publicar('route-optimizations') → [Espera async] → 
MessageHandlers.handleRouteOptimization() → OptimizacionService.optimizarRuta() → 
[Múltiples repositorios y APIs] → PubSubService.publicar('route-optimizations-results') → 
[Controller recibe resultado] → Cliente
```

**Detalles:**
1. **Entrada:** 
   - `equipoId` (parámetro de ruta)
   - `fecha` (opcional, query parameter)
2. **Procesamiento:**
   - Verifica existencia del equipo
   - Verifica formato de fecha
   - Comprueba si ya existe una ruta para esa fecha
   - Publica mensaje para procesamiento asíncrono
   - Espera resultado con timeout (120 segundos)
3. **Servicios:**
   - `OptimizacionService`
   - `PubSubService`
   - `TraficoClimaService`
4. **Repositorios/Tablas:**
   - `EquipoRepository` (tabla `equipos`)
   - `RutaRepository` (tabla `rutas`)
   - `EnvioRepository` (tabla `envios`)
   - `VehiculoRepository` (tabla `vehiculos`)
   - `SlaRepository` (tabla `slas`)
5. **APIs Externas:**
   - `TraficoClimaApi` (condiciones de tráfico y clima)
   - `GpsApi` (ubicaciones actuales)
   - `VehiculoApi` (capacidades de vehículos)
6. **Algoritmos:**
   - Selección de envíos por capacidad de vehículo
   - Vecino más cercano para orden de entrega
   - Cálculo de tiempos con condiciones actuales
7. **Salida:**
   - Éxito: `{ success: true, message: string, data: Ruta }`
   - Procesando: `{ success: true, message: string, data: { requestId, equipoId } }`
   - Error: `{ success: false, message: string, data: { error } }`

### Replanificación de Rutas: POST /api/rutas/replanificar

**Flujo de Secuencia:**
```
Cliente → RutasController.replanificarRuta() → EquipoRepository.findById() → 
EventoService.obtenerEvento() → PubSubService.publicar('route-replanifications') → 
[Espera async] → MessageHandlers.handleRouteReplanification() → 
OptimizacionService.validarReplanificacion() → OptimizacionService.replanificarRuta() → 
[Recálculo de ruta] → PubSubService.publicar('route-optimizations-results') → 
[Controller recibe resultado] → Cliente
```

**Detalles:**
1. **Entrada:** 
   - Body: `{ equipoId: string, eventoId: string }`
2. **Procesamiento:**
   - Valida existencia del equipo y evento
   - Publica mensaje para procesamiento asíncrono
   - Verifica que no se haya replanificado por el mismo evento
   - Recalcula ruta desde ubicación actual considerando condiciones
3. **Servicios:**
   - `OptimizacionService`
   - `EventoService`
   - `PubSubService`
   - `TraficoClimaService`
4. **Repositorios/Tablas:**
   - `EquipoRepository` (tabla `equipos`)
   - `EventoRepository` (tabla `eventos`)
   - `RutaRepository` (tabla `rutas`)
   - `EnvioRepository` (tabla `envios`)
   - `GpsRepository` (tabla `gps_registros`)
5. **Salida:**
   - Éxito: `{ success: true, message: string, data: Ruta }`
   - Procesando: `{ success: true, message: string, data: { requestId, equipoId, eventoId } }`
   - Error: `{ success: false, message: string, data: { error } }`

### Optimización Masiva: POST /api/rutas/optimizar-ciudad/:ciudadId

**Flujo de Secuencia:**
```
Cliente → RutasController.optimizarRutasCiudad() → OptimizacionService.optimizarRutasMasivas() →
[Obtener equipos de ciudad] → EquipoRepository.findByCiudad() → 
[Para cada equipo] → OptimizacionService.optimizarRuta() → 
[Proceso de optimización] → Cliente
```

**Detalles:**
1. **Entrada:**
   - `ciudadId` (parámetro de ruta)
   - Body: `{ fecha: string }` (opcional)
2. **Procesamiento:**
   - Valida formato de fecha
   - Obtiene todos los equipos disponibles en la ciudad
   - Obtiene todos los envíos pendientes en la ciudad
   - Distribuye envíos entre equipos según capacidad
   - Optimiza ruta para cada equipo
3. **Servicios:**
   - `OptimizacionService`
   - `TraficoClimaService`
4. **Repositorios/Tablas:**
   - `EquipoRepository` (tabla `equipos`)
   - `VehiculoRepository` (tabla `vehiculos`)
   - `EnvioRepository` (tabla `envios`)
   - `RutaRepository` (tabla `rutas`)
   - `SlaRepository` (tabla `slas`)
5. **Salida:**
   - Éxito: `{ success: true, message: string, data: { rutasCreadas, enviosAsignados, equiposOptimizados } }`
   - Error: `{ success: false, message: string, data: { error } }`

### Registrar Evento: POST /api/eventos

**Flujo de Secuencia:**
```
Cliente → EventosController.registrarEvento() → EventoService.registrarEvento() →
EventoRepository.create() → PubSubService.publicar('delivery-events') → Cliente
```

**Detalles:**
1. **Entrada:** 
   - Body: `{ equipoId, tipo, descripcion, latitud, longitud, ciudadId, impacto }`
2. **Procesamiento:**
   - Valida datos con `CrearEventoDto.validationSchema`
   - Genera ID único para el evento
   - Almacena evento en base de datos
   - Notifica a sistemas interesados mediante PubSub
3. **Servicios:**
   - `EventoService`
   - `PubSubService`
4. **Repositorios/Tablas:**
   - `EventoRepository` (tabla `eventos`)
5. **Salida:**
   - Éxito: `{ success: true, message: string, data: Evento }`
   - Error: `{ success: false, message: string, data: { error } }`

### Condiciones de Tráfico: GET /api/trafico-clima/trafico/:ciudadId

**Flujo de Secuencia:**
```
Cliente → TraficoClimaController.obtenerCondicionesTrafico() →
TraficoClimaService.obtenerCondicionesTrafico() →
TraficoClimaApi.obtenerCondicionesTrafico() → [Circuit Breaker] → Cliente
```

**Detalles:**
1. **Entrada:**
   - `ciudadId` (parámetro de ruta)
2. **Procesamiento:**
   - Obtiene condiciones de tráfico desde el servicio
   - Utiliza Circuit Breaker para manejar fallos de API externa
   - Retorna datos desde caché si la API externa falla
3. **Servicios:**
   - `TraficoClimaService`
4. **APIs Externas:**
   - `TraficoClimaApi`
5. **Patrones Resilientes:**
   - Circuit Breaker para protección de fallas
   - Caché con Redis para respuesta rápida
6. **Salida:**
   - Éxito: `{ success: true, message: string, data: { ciudadId, nivel, descripcion, timestamp } }`
   - Error: `{ success: false, message: string, data: { error } }`

### Evaluación de Condiciones: GET /api/trafico-clima/evaluacion/:ciudadId

**Flujo de Secuencia:**
```
Cliente → TraficoClimaController.obtenerEvaluacionCondiciones() →
TraficoClimaService.evaluarCondicionesGenerales() →
[Obtener tráfico y clima] → [Calcular riesgo y factor] → Cliente
```

**Detalles:**
1. **Entrada:**
   - `ciudadId` (parámetro de ruta)
2. **Procesamiento:**
   - Obtiene condiciones de tráfico y clima
   - Calcula nivel de riesgo general
   - Determina factor de ajuste para tiempos
   - Genera recomendaciones operativas
3. **Servicios:**
   - `TraficoClimaService`
4. **Salida:**
   - Éxito: `{ success: true, message: string, data: { nivelRiesgo, factorDelay, recomendaciones } }`
   - Error: `{ success: false, message: string, data: { error } }`

## Implementación de Algoritmos de Optimización

### Algoritmo de Asignación de Envíos (OptimizacionService.optimizarCargaYRuta)

**Flujo del Algoritmo:**
```
[Entrada] → [Obtener SLAs] → [Obtener condiciones] → [Evaluar condiciones] →
[Para cada envío] → [Calcular impacto de ruta] → [Calcular puntaje] →
[Ordenar por puntaje] → [Seleccionar hasta capacidad] →
[Optimizar orden con Vecino más Cercano] → [Calcular distancia total] →
[Calcular tiempo ajustado] → [Salida]
```

**Detalles:**
1. **Entrada:** Envíos disponibles, ubicación inicial, capacidad vehículo, equipo
2. **Factores para puntaje:**
   - Prioridad SLA (menor = más prioritario)
   - Distancia desde ubicación actual
   - Factor de ajuste por condiciones climáticas y tráfico
3. **Ordenamiento:** Por puntaje (menor = mejor)
4. **Selección:** Hasta llenar capacidad (peso y volumen)
5. **Vecino más Cercano:**
   - Inicia en ubicación actual
   - Selecciona envío más cercano
   - Actualiza ubicación actual
   - Repite hasta asignar todos los envíos
6. **Ajuste de Tiempo:**
   - Considera impacto de condiciones en cada tramo
   - Aplica factores de ajuste según nivel de impacto
7. **Salida:** Lista ordenada de envíos, distancia total, tiempo estimado

### Algoritmo de Replanificación (OptimizacionService.replanificarRuta)

**Flujo del Algoritmo:**
```
[Entrada] → [Verificar replanificación previa] → [Obtener ruta actual] →
[Obtener ubicación actual] → [Obtener envíos no entregados] →
[Actualizar condiciones] → [Recalcular optimización] →
[Actualizar ruta en BD] → [Salida]
```

**Detalles:**
1. **Entrada:** ID de equipo, ID de evento
2. **Procesamiento:**
   - Verifica que no se haya replanificado por el mismo evento
   - Obtiene la ruta actual del equipo
   - Determina ubicación actual mediante GPS
   - Filtra envíos que aún no han sido entregados
   - Obtiene condiciones actualizadas de tráfico y clima
   - Aplica algoritmo de optimización desde la ubicación actual
   - Actualiza la ruta en base de datos (envíos, distancia, tiempo)
3. **Salida:** Ruta actualizada o null si no se puede replanificar

### Algoritmo de Optimización Masiva (OptimizacionService.optimizarRutasMasivas)

**Flujo del Algoritmo:**
```
[Entrada] → [Obtener equipos disponibles] → [Obtener envíos pendientes] →
[Para cada equipo] → [Asignar envíos óptimos] → [Optimizar ruta] →
[Actualizar estados] → [Calcular métricas globales] → [Salida]
```

**Detalles:**
1. **Entrada:** ID de ciudad, fecha
2. **Procesamiento:**
   - Obtiene equipos disponibles en la ciudad
   - Obtiene todos los envíos pendientes
   - Ordena envíos por prioridad SLA
   - Para cada equipo:
     * Verifica capacidad del vehículo
     * Selecciona envíos más prioritarios que quedan en capacidad
     * Optimiza la ruta según algoritmo del vecino más cercano
     * Actualiza estado de envíos y rutas en BD
   - Maneja errores para continuar con otros equipos si alguno falla
3. **Salida:** Resumen con rutas creadas, envíos asignados y equipos optimizados

## Estructura de la Base de Datos

El sistema utiliza una base de datos PostgreSQL para almacenar datos operativos e históricos. A continuación se detalla la estructura real de la base de datos, las tablas que pertenecen a servicios externos, y cómo se relacionan entre sí.

### Tablas Principales Internas

**1. equipos**
- Almacena información sobre los equipos de entrega y sus transportistas
- Campos principales: `id` (PK), `nombre`, `transportistas` (JSONB), `vehiculo_id`, `disponible`, `ciudad_id`
- Relación directa con vehículos (un equipo tiene un vehículo asignado)
- Relación con envíos (un equipo puede tener múltiples envíos asignados)
- Relación con rutas (un equipo puede tener múltiples rutas)

**2. vehiculos**
- Almacena información básica sobre la flota de vehículos disponibles
- Campos principales: `id` (PK), `placa`, `modelo`, `tipo`, `capacidad_peso`, `capacidad_volumen`, `disponible`
- Relacionado con equipos (un vehículo puede estar asignado a un equipo)

**3. envios**
- Contiene los detalles de cada paquete o envío a entregar
- Campos principales: `id` (PK), `guia`, `direccion_origen`, `direccion_destino`, `latitud_destino`, `longitud_destino`, `ciudad_id`, `peso`, `volumen`, `estado`, `sla_id`, `equipo_id`, `orden_entrega`, `fecha_entrega_estimada`, `fecha_entrega_real`
- Relacionado con equipos (un envío puede ser asignado a un equipo)
- Relacionado con SLAs (cada envío tiene un SLA asociado)

**4. rutas**
- Almacena las rutas optimizadas para cada equipo
- Campos principales: `id` (PK), `equipo_id`, `fecha`, `envios` (JSONB), `estado`, `distancia_total`, `tiempo_estimado`, `replanificada`, `ultimo_evento_id`
- Relacionado con equipos (cada ruta pertenece a un equipo)
- Contiene referencia a eventos (cuando una ruta ha sido replanificada debido a un evento)

**5. eventos**
- Registra eventos inesperados que pueden afectar las rutas
- Campos principales: `id` (PK), `equipo_id`, `tipo`, `descripcion`, `latitud`, `longitud`, `ciudad_id`, `impacto`, `fecha`, `activo`, `metadatos` (JSONB)
- Relacionado con equipos (un evento puede estar asociado a un equipo)
- Puede provocar replanificación de rutas

**6. equipos_ubicacion_actual**
- Tabla normalizada que mantiene la ubicación actual de cada equipo
- Campos principales: `equipo_id` (PK), `latitud`, `longitud`, `velocidad`, `timestamp`
- Relacionado con equipos (referencia directa por clave foránea)
- NOTA: Se actualiza con datos del servicio externo de GPS mediante el proceso de sincronización

**7. slas**
- Define los acuerdos de nivel de servicio para los envíos
- Campos principales: `id` (PK), `nombre`, `descripcion`, `tiempo_entrega`, `prioridad`, `activo`
- Relacionado con envíos (un SLA puede aplicar a múltiples envíos)

**8. usuarios**
- Almacena los usuarios del sistema con sus roles y credenciales
- Campos principales: `id` (PK), `username`, `password`, `nombre`, `apellido`, `role`, `activo`
- Roles definidos: ADMIN, OPERADOR, TRANSPORTISTA

### Relaciones Principales entre Tablas Internas

- **Equipos y Vehículos**: Relación uno a uno. Un equipo tiene asignado un vehículo (`equipos.vehiculo_id → vehiculos.id`).

- **Equipos y Envíos**: Relación uno a muchos. Un equipo puede tener múltiples envíos asignados (`envios.equipo_id → equipos.id`).

- **Envíos y SLAs**: Relación muchos a uno. Múltiples envíos pueden tener el mismo SLA (`envios.sla_id → slas.id`).

- **Equipos y Rutas**: Relación uno a muchos. Un equipo puede tener múltiples rutas asignadas en diferentes fechas (`rutas.equipo_id → equipos.id`).

- **Equipos y Eventos**: Relación uno a muchos. Un equipo puede registrar múltiples eventos (`eventos.equipo_id → equipos.id`).

- **Equipos y Ubicación Actual**: Relación uno a uno. Cada equipo tiene exactamente una ubicación actual (`equipos_ubicacion_actual.equipo_id → equipos.id`).

### Tablas Externas

**1. gps_registros**
- Tabla que pertenece al API de GPS, no es interna del sistema
- Almacena el histórico de ubicaciones GPS de los equipos
- Campos principales: `id` (PK), `equipo_id`, `latitud`, `longitud`, `velocidad`, `timestamp`
- Se utiliza como fuente de datos para actualizar la tabla interna `equipos_ubicacion_actual`
- Contiene datos de simulación para pruebas y desarrollo

### Servicios Externos (Sin Tablas en la Base de Datos)

El sistema interactúa con varios servicios externos a través de APIs. Estos servicios NO tienen tablas propias en la base de datos del sistema y NO mantienen relaciones directas en la base de datos con las tablas internas.

#### 1. Servicio de Tráfico y Clima (TraficoClimaApi)
- **Naturaleza**: Servicio completamente externo
- **Datos proporcionados**: Condiciones de tráfico, clima e impacto en rutas
- **Método de integración**: API REST
- **Almacenamiento**: No se almacenan permanentemente estos datos en la base de datos
- **Uso de datos**: 
  - Utilizados temporalmente durante la planificación y replanificación de rutas
  - Afectan cálculos de tiempos estimados y priorización de entregas
  - Se pueden cachear brevemente (Redis) para mejorar rendimiento

#### 2. Servicio de GPS (GpsApi)
- **Naturaleza**: Servicio externo con persistencia de datos en tabla externa `gps_registros`
- **Datos proporcionados**: Ubicaciones en tiempo real de equipos
- **Método de integración**: API REST y mensajes asíncronos (Pub/Sub)
- **Almacenamiento**: 
  - Los datos recibidos se almacenan en la tabla externa `gps_registros`
  - Datos relevantes se sincronizan a la tabla interna `equipos_ubicacion_actual`
- **Uso de datos**: 
  - Seguimiento en tiempo real de equipos
  - Base para replanificaciones
  - Histórico de movimiento de flota
- **Sincronización**: 
  - El endpoint `POST /api/gps/sincronizar_ubicacion` (URL completa: `http://localhost:3000/api/gps/sincronizar_ubicacion`)
  - Se ejecuta cada 5 horas (anteriormente cada 5 minutos) mediante Cloud Scheduler
  - Configuración cron: `0 */5 * * *`
  - Obtiene ubicaciones aleatorias de `gps_registros` para cada equipo activo
  - Actualiza la tabla `equipos_ubicacion_actual` con la última ubicación
  - Publica actualizaciones al tema `gps-updates` de Pub/Sub para notificar a otros sistemas
- **Generación de datos de prueba**:
  - Endpoint: `POST /api/gps/generar_datos_prueba`
  - Ejemplo de inserción manual de datos:
  ```sql
  INSERT INTO gps_registros (id, equipo_id, latitud, longitud, velocidad, timestamp)
  VALUES 
    ('gps-101', 'equipo-001', 4.65123, -74.05456, 35.5, NOW()),
    ('gps-102', 'equipo-001', 4.66789, -74.06123, 40.2, NOW() - INTERVAL '30 minutes'),
    ('gps-103', 'equipo-002', 4.61234, -74.08567, 22.3, NOW()),
    ('gps-104', 'equipo-002', 4.62345, -74.07890, 15.7, NOW() - INTERVAL '45 minutes');
  ```

#### 3. Servicio de Vehículos (VehiculoApi)
- **Naturaleza**: Servicio externo que complementa datos internos
- **Datos proporcionados**: Información detallada sobre estado y mantenimiento de vehículos
- **Método de integración**: API REST
- **Almacenamiento**: 
  - Información básica se almacena en la tabla interna `vehiculos`
  - Datos detallados no se persisten en la base de datos
  - No existe una "tabla externa" de vehículos
- **Uso de datos**:
  - Verificación de disponibilidad en tiempo real
  - Información detallada sobre mantenimiento cuando se necesita
  - Características avanzadas del vehículo al planificar rutas

### Integración de Datos entre Sistema y Servicios Externos

- **Sin relaciones directas en base de datos**: Los servicios externos no tienen tablas en la base de datos del sistema, por lo que no existen relaciones SQL entre ellos y las tablas internas.

- **Obtención de datos**: Se realiza mediante llamadas API o suscripciones Pub/Sub en el momento que se necesitan.

- **Persistencia selectiva**: Solo ciertos datos externos (como ubicaciones GPS) se persisten en tablas internas del sistema.

- **Patrón de resiliencia**: Implementación de Circuit Breaker para manejar fallos en servicios externos y estrategias de caché.

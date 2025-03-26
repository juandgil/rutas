/**
 * Esquemas para documentación Swagger
 * 
 * Este archivo contiene las definiciones de esquemas utilizados en la documentación
 * de la API con Swagger/OpenAPI. No son entidades reales, sino representaciones
 * para la documentación.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensaje de error
 *       example:
 *         error: "Recurso no encontrado"
 * 
 *     Credenciales:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario
 *       example:
 *         email: usuario@ejemplo.com
 *         password: contraseña123
 * 
 *     Token:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Token JWT de autenticación
 *         expiresIn:
 *           type: string
 *           description: Tiempo de expiración del token
 *       example:
 *         token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         expiresIn: 24h
 * 
 *     Equipo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único del equipo
 *         nombre:
 *           type: string
 *           description: Nombre del equipo
 *         vehiculoId:
 *           type: string
 *           description: ID del vehículo asignado al equipo
 *         ciudadId:
 *           type: string
 *           description: ID de la ciudad donde opera el equipo
 *         latitud:
 *           type: number
 *           format: float
 *           description: Latitud de la última ubicación conocida
 *         longitud:
 *           type: number
 *           format: float
 *           description: Longitud de la última ubicación conocida
 *         activo:
 *           type: boolean
 *           description: Estado activo del equipo
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: eq-001
 *         nombre: Equipo Alpha
 *         vehiculoId: veh-001
 *         ciudadId: bogota
 *         latitud: 4.624335
 *         longitud: -74.063644
 *         activo: true
 *         createdAt: "2023-10-25T14:00:00Z"
 *         updatedAt: "2023-10-25T14:00:00Z"
 * 
 *     Vehiculo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único del vehículo
 *         placa:
 *           type: string
 *           description: Placa del vehículo
 *         tipo:
 *           type: string
 *           enum: [CAMION, FURGON, CAMIONETA, MOTOCICLETA]
 *           description: Tipo de vehículo
 *         capacidadPeso:
 *           type: number
 *           description: Capacidad máxima de peso en kg
 *         capacidadVolumen:
 *           type: number
 *           description: Capacidad máxima de volumen en m³
 *         activo:
 *           type: boolean
 *           description: Estado activo del vehículo
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: veh-001
 *         placa: ABC123
 *         tipo: FURGON
 *         capacidadPeso: 1500
 *         capacidadVolumen: 12
 *         activo: true
 *         createdAt: "2023-10-25T14:00:00Z"
 *         updatedAt: "2023-10-25T14:00:00Z"
 * 
 *     Envio:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único del envío
 *         direccionOrigen:
 *           type: string
 *           description: Dirección de origen
 *         direccionDestino:
 *           type: string
 *           description: Dirección de destino
 *         latitudOrigen:
 *           type: number
 *           format: float
 *           description: Latitud del origen
 *         longitudOrigen:
 *           type: number
 *           format: float
 *           description: Longitud del origen
 *         latitudDestino:
 *           type: number
 *           format: float
 *           description: Latitud del destino
 *         longitudDestino:
 *           type: number
 *           format: float
 *           description: Longitud del destino
 *         ciudadId:
 *           type: string
 *           description: ID de la ciudad del envío
 *         peso:
 *           type: number
 *           description: Peso del envío en kg
 *         volumen:
 *           type: number
 *           description: Volumen del envío en m³
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, ASIGNADO, EN_TRANSITO, ENTREGADO, CANCELADO]
 *           description: Estado actual del envío
 *         slaId:
 *           type: string
 *           description: ID del SLA aplicable al envío
 *         equipoId:
 *           type: string
 *           description: ID del equipo asignado
 *         ordenEntrega:
 *           type: integer
 *           description: Orden de entrega en la ruta
 *         fechaEntregaEstimada:
 *           type: string
 *           format: date-time
 *           description: Fecha estimada de entrega
 *         fechaEntregaReal:
 *           type: string
 *           format: date-time
 *           description: Fecha real de entrega
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: env-001
 *         direccionOrigen: "Calle 100 #15-20"
 *         direccionDestino: "Carrera 7 #82-30"
 *         latitudOrigen: 4.6871
 *         longitudOrigen: -74.0426
 *         latitudDestino: 4.6664
 *         longitudDestino: -74.0529
 *         ciudadId: bogota
 *         peso: 10.5
 *         volumen: 0.25
 *         estado: PENDIENTE
 *         slaId: sla-estandar
 *         equipoId: null
 *         ordenEntrega: null
 *         fechaEntregaEstimada: null
 *         fechaEntregaReal: null
 *         createdAt: "2023-10-25T14:00:00Z"
 *         updatedAt: "2023-10-25T14:00:00Z"
 * 
 *     Ruta:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único de la ruta
 *         equipoId:
 *           type: string
 *           description: ID del equipo asignado
 *         fecha:
 *           type: string
 *           format: date
 *           description: Fecha planificada de la ruta
 *         envios:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de los envíos incluidos en la ruta
 *         estado:
 *           type: string
 *           enum: [PLANIFICADA, EN_PROGRESO, COMPLETADA, CANCELADA]
 *           description: Estado actual de la ruta
 *         distanciaTotal:
 *           type: number
 *           description: Distancia total de la ruta en km
 *         tiempoEstimado:
 *           type: integer
 *           description: Tiempo estimado de la ruta en minutos
 *         replanificada:
 *           type: boolean
 *           description: Indica si la ruta ha sido replanificada
 *         ultimoEventoId:
 *           type: string
 *           description: ID del último evento que causó replanificación
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: ruta-001
 *         equipoId: eq-001
 *         fecha: "2023-10-25"
 *         envios: ["env-001", "env-002", "env-003"]
 *         estado: PLANIFICADA
 *         distanciaTotal: 15.5
 *         tiempoEstimado: 45
 *         replanificada: false
 *         ultimoEventoId: null
 *         createdAt: "2023-10-25T06:00:00Z"
 *         updatedAt: "2023-10-25T06:00:00Z"
 * 
 *     Evento:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único del evento
 *         tipo:
 *           type: string
 *           enum: [TRAFICO, CLIMA, VEHICULO, CANCELACION, OTRO]
 *           description: Tipo de evento
 *         descripcion:
 *           type: string
 *           description: Descripción del evento
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del evento
 *         ciudadId:
 *           type: string
 *           description: ID de la ciudad afectada
 *         equipoId:
 *           type: string
 *           description: ID del equipo afectado
 *         metadatos:
 *           type: object
 *           description: Metadatos adicionales del evento
 *         activo:
 *           type: boolean
 *           description: Indica si el evento está activo
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: ev-001
 *         tipo: TRAFICO
 *         descripcion: "Cierre vial por manifestación"
 *         fecha: "2023-10-25T10:30:00Z"
 *         ciudadId: bogota
 *         equipoId: eq-001
 *         metadatos: {
 *           nivelTraficoActual: "ALTO",
 *           reporteTrafico: "Tráfico denso en varias zonas de la ciudad"
 *         }
 *         activo: true
 *         createdAt: "2023-10-25T10:30:00Z"
 *         updatedAt: "2023-10-25T10:30:00Z"
 */ 
/**
 * @swagger
 * components:
 *   schemas:
 *     Evento:
 *       type: object
 *       required:
 *         - tipo
 *         - descripcion
 *         - ciudadId
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del evento
 *         tipo:
 *           type: string
 *           enum: [TRAFICO, CLIMA, VEHICULO, CANCELACION, OTRO]
 *           description: Tipo de evento
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del evento
 *         latitud:
 *           type: number
 *           format: float
 *           description: Latitud donde ocurrió el evento
 *         longitud:
 *           type: number
 *           format: float
 *           description: Longitud donde ocurrió el evento
 *         ciudadId:
 *           type: string
 *           description: ID de la ciudad afectada
 *         equipoId:
 *           type: string
 *           description: ID del equipo afectado (opcional)
 *         impacto:
 *           type: string
 *           enum: [BAJO, MEDIO, ALTO, CRITICO]
 *           description: Nivel de impacto estimado del evento
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del evento
 *         activo:
 *           type: boolean
 *           description: Indica si el evento sigue activo
 *       example:
 *         id: "ev-001"
 *         tipo: "TRAFICO"
 *         descripcion: "Cierre vial por manifestación"
 *         latitud: 4.6782
 *         longitud: -74.0582
 *         ciudadId: "bogota"
 *         equipoId: "eq-001"
 *         impacto: "ALTO"
 *         fecha: "2023-11-15T10:30:00Z"
 *         activo: true
 *     
 *     CrearEventoRequest:
 *       type: object
 *       required:
 *         - tipo
 *         - descripcion
 *         - ciudadId
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [TRAFICO, CLIMA, VEHICULO, CANCELACION, OTRO]
 *           description: Tipo de evento
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del evento
 *         latitud:
 *           type: number
 *           format: float
 *           description: Latitud donde ocurrió el evento
 *         longitud:
 *           type: number
 *           format: float
 *           description: Longitud donde ocurrió el evento
 *         ciudadId:
 *           type: string
 *           description: ID de la ciudad afectada
 *         equipoId:
 *           type: string
 *           description: ID del equipo afectado (opcional)
 *         impacto:
 *           type: string
 *           enum: [BAJO, MEDIO, ALTO, CRITICO]
 *           description: Nivel de impacto estimado del evento
 *       example:
 *         tipo: "TRAFICO"
 *         descripcion: "Cierre vial por manifestación"
 *         latitud: 4.6782
 *         longitud: -74.0582
 *         ciudadId: "bogota"
 *         equipoId: "eq-001"
 *         impacto: "ALTO"
 */ 
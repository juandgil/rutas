/**
 * @swagger
 * components:
 *   schemas:
 *     GpsUbicacion:
 *       type: object
 *       required:
 *         - equipoId
 *         - latitud
 *         - longitud
 *         - velocidad
 *       properties:
 *         equipoId:
 *           type: string
 *           description: ID del equipo
 *         latitud:
 *           type: number
 *           format: float
 *           description: Latitud en grados decimales
 *         longitud:
 *           type: number
 *           format: float
 *           description: Longitud en grados decimales
 *         velocidad:
 *           type: number
 *           format: float
 *           description: Velocidad en km/h
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del registro
 *       example:
 *         equipoId: "equipo-001"
 *         latitud: 4.624335
 *         longitud: -74.063644
 *         velocidad: 35.5
 *         timestamp: "2023-11-15T14:30:00Z"
 */ 
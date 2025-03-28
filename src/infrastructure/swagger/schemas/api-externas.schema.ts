/**
 * @swagger
 * components:
 *   schemas:
 *     CondicionTrafico:
 *       type: object
 *       properties:
 *         ciudadId:
 *           type: string
 *           description: ID de la ciudad
 *         nivel:
 *           type: string
 *           enum: [BAJO, MEDIO, ALTO, CONGESTIONADO]
 *           description: Nivel de tráfico
 *         descripcion:
 *           type: string
 *           description: Descripción de las condiciones de tráfico
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la medición
 *       example:
 *         ciudadId: "ciudad-001"
 *         nivel: "MEDIO"
 *         descripcion: "Tráfico moderado en algunas vías principales"
 *         timestamp: "2023-11-15T14:30:00Z"
 *     
 *     CondicionClima:
 *       type: object
 *       properties:
 *         ciudadId:
 *           type: string
 *           description: ID de la ciudad
 *         estado:
 *           type: string
 *           enum: [DESPEJADO, NUBLADO, LLUVIOSO, TORMENTA]
 *           description: Estado del clima
 *         temperatura:
 *           type: number
 *           format: float
 *           description: Temperatura en grados Celsius
 *         lluvia:
 *           type: number
 *           format: float
 *           description: Precipitación en mm
 *         viento:
 *           type: number
 *           format: integer
 *           description: Velocidad del viento en km/h
 *         visibilidad:
 *           type: number
 *           format: float
 *           description: Visibilidad en km
 *         descripcion:
 *           type: string
 *           description: Descripción de las condiciones climáticas
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la medición
 *       example:
 *         ciudadId: "ciudad-001"
 *         estado: "LLUVIOSO"
 *         temperatura: 15.5
 *         lluvia: 3.5
 *         viento: 18
 *         visibilidad: 3.2
 *         descripcion: "Lluvia moderada, precaución en las vías"
 *         timestamp: "2023-11-15T14:30:00Z"
 *     
 *     ImpactoRuta:
 *       type: object
 *       properties:
 *         tiempoAdicional:
 *           type: integer
 *           description: Tiempo adicional estimado en minutos
 *         distanciaAdicional:
 *           type: number
 *           format: float
 *           description: Distancia adicional estimada en km
 *         nivelImpacto:
 *           type: string
 *           enum: [BAJO, MEDIO, ALTO, CRITICO]
 *           description: Nivel de impacto estimado
 *       example:
 *         tiempoAdicional: 15
 *         distanciaAdicional: 3.2
 *         nivelImpacto: "MEDIO"
 */ 
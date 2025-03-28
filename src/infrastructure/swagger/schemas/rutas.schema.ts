/**
 * @swagger
 * components:
 *   schemas:
 *     Ruta:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la ruta
 *         equipoId:
 *           type: string
 *           description: ID del equipo asignado
 *         fecha:
 *           type: string
 *           format: date
 *           description: Fecha para la que se calculó la ruta
 *         envios:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EnvioRuta'
 *           description: Lista de envíos en la ruta
 *         estado:
 *           type: string
 *           enum: [PLANIFICADA, EN_PROGRESO, COMPLETADA, CANCELADA]
 *           description: Estado actual de la ruta
 *         distanciaTotal:
 *           type: number
 *           format: float
 *           description: Distancia total de la ruta en kilómetros
 *         tiempoEstimado:
 *           type: number
 *           format: integer
 *           description: Tiempo estimado de la ruta en minutos
 *         replanificada:
 *           type: boolean
 *           description: Indica si la ruta ha sido replanificada
 *         ultimoEventoId:
 *           type: string
 *           description: ID del último evento que causó una replanificación
 *       example:
 *         id: "ruta-001"
 *         equipoId: "equipo-001"
 *         fecha: "2023-11-15"
 *         estado: "PLANIFICADA"
 *         distanciaTotal: 35.4
 *         tiempoEstimado: 120
 *         replanificada: false
 *         ultimoEventoId: null
 *         envios: [
 *           {
 *             id: "env-001",
 *             guia: "GU12345",
 *             direccionDestino: "Calle 100 #15-20",
 *             latitudDestino: 4.6871,
 *             longitudDestino: -74.0426,
 *             ordenEntrega: 1,
 *             slaId: "sla-001",
 *             prioridadSla: 1
 *           },
 *           {
 *             id: "env-002",
 *             guia: "GU12346",
 *             direccionDestino: "Carrera 7 #72-41",
 *             latitudDestino: 4.6582,
 *             longitudDestino: -74.0536,
 *             ordenEntrega: 2,
 *             slaId: "sla-002",
 *             prioridadSla: 2
 *           }
 *         ]
 *
 *     EnvioRuta:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del envío
 *         guia:
 *           type: string
 *           description: Número de guía
 *         direccionDestino:
 *           type: string
 *           description: Dirección de entrega
 *         latitudDestino:
 *           type: number
 *           format: float
 *           description: Latitud del destino
 *         longitudDestino:
 *           type: number
 *           format: float
 *           description: Longitud del destino
 *         ordenEntrega:
 *           type: integer
 *           description: Orden de entrega en la ruta
 *         slaId:
 *           type: string
 *           description: ID del SLA aplicable
 *         prioridadSla:
 *           type: integer
 *           description: Nivel de prioridad según SLA (menor es más prioritario)
 *       example:
 *         id: "env-001"
 *         guia: "GU12345"
 *         direccionDestino: "Calle 100 #15-20"
 *         latitudDestino: 4.6871
 *         longitudDestino: -74.0426
 *         ordenEntrega: 1
 *         slaId: "sla-001"
 *         prioridadSla: 1
 *
 *     ReplanificarRutaRequest:
 *       type: object
 *       required:
 *         - eventoId
 *       properties:
 *         eventoId:
 *           type: string
 *           description: ID del evento que causó la replanificación
 *       example:
 *         eventoId: "ev-001"
 */ 
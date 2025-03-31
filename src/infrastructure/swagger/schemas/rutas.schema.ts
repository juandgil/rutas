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
 *         eventoId: "c3fee4d5-8664-4c52-8072-3ac815462821"
 *
 *     RutaResponseDto:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica si la operación fue exitosa
 *         message:
 *           type: string
 *           description: Mensaje descriptivo del resultado
 *         data:
 *           type: object
 *           description: Datos de la ruta optimizada
 *           properties:
 *             id:
 *               type: string
 *               description: ID único de la ruta
 *             equipoId:
 *               type: string
 *               description: ID del equipo asignado
 *             fecha:
 *               type: string
 *               format: date
 *               description: Fecha para la que se calculó la ruta
 *             envios:
 *               type: array
 *               items:
 *                 type: string
 *               description: Lista de IDs de envíos en la ruta
 *             estado:
 *               type: string
 *               enum: [PLANIFICADA, EN_PROGRESO, COMPLETADA, CANCELADA]
 *               description: Estado actual de la ruta
 *             distanciaTotal:
 *               type: string
 *               description: Distancia total de la ruta en kilómetros
 *             tiempoEstimado:
 *               type: number
 *               description: Tiempo estimado de la ruta en minutos
 *             replanificada:
 *               type: boolean
 *               description: Indica si la ruta ha sido replanificada
 *             ultimoEventoId:
 *               type: string
 *               nullable: true
 *               description: ID del último evento que causó una replanificación
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Fecha de creación
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Fecha de última actualización
 *       example:
 *         success: true
 *         message: "Ruta optimizada correctamente"
 *         data:
 *           id: "ff25d4ad-3839-4732-bf4a-1e2fe6a9cfa8"
 *           equipoId: "equipo-001"
 *           fecha: "2025-03-29T05:00:00.000Z"
 *           envios: ["envio-001", "envio-002", "envio-003"]
 *           estado: "PLANIFICADA"
 *           distanciaTotal: "15.50"
 *           tiempoEstimado: 45
 *           replanificada: false
 *           ultimoEventoId: null
 *           createdAt: "2025-03-31T14:45:52.305Z"
 *           updatedAt: "2025-03-31T14:45:52.305Z"
 */ 
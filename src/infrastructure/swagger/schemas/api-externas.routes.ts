/**
 * @swagger
 * /api/trafico-clima/trafico/{ciudadId}:
 *   get:
 *     summary: Obtiene condiciones de tráfico para una ciudad
 *     tags: [APIs Externas]
 *     parameters:
 *       - in: path
 *         name: ciudadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ciudad
 *         example: "ciudad-001"
 *     responses:
 *       200:
 *         description: Información de tráfico o mensaje informativo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CondicionTrafico'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Condiciones de tráfico obtenidas"
 *                   data:
 *                     ciudadId: "ciudad-001"
 *                     nivel: "MEDIO"
 *                     descripcion: "Tráfico moderado en algunas vías principales"
 *                     timestamp: "2023-11-15T14:30:00Z"
 *               not-found:
 *                 value:
 *                   success: false
 *                   message: "Ciudad no encontrada"
 *                   data: null
 *       500:
 *         description: Error del servidor
 * 
 * /api/trafico-clima/clima/{ciudadId}:
 *   get:
 *     summary: Obtiene condiciones climáticas para una ciudad
 *     tags: [APIs Externas]
 *     parameters:
 *       - in: path
 *         name: ciudadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ciudad
 *         example: "ciudad-001"
 *     responses:
 *       200:
 *         description: Información del clima o mensaje informativo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CondicionClima'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Condiciones climáticas obtenidas"
 *                   data:
 *                     ciudadId: "ciudad-001"
 *                     estado: "LLUVIOSO"
 *                     temperatura: 15.5
 *                     lluvia: 3.5
 *                     viento: 18
 *                     visibilidad: 3.2
 *                     descripcion: "Lluvia moderada, precaución en las vías"
 *                     timestamp: "2023-11-15T14:30:00Z"
 *               not-found:
 *                 value:
 *                   success: false
 *                   message: "Ciudad no encontrada"
 *                   data: null
 *       500:
 *         description: Error del servidor
 * 
 * /api/trafico-clima/impacto:
 *   post:
 *     summary: Obtiene impacto de las condiciones de tráfico y clima en una ruta
 *     tags: [APIs Externas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origen:
 *                 $ref: '#/components/schemas/Coordenadas'
 *               destino:
 *                 $ref: '#/components/schemas/Coordenadas'
 *           example:
 *             origen:
 *               latitud: 4.624335
 *               longitud: -74.063644
 *             destino:
 *               latitud: 4.687435
 *               longitud: -74.042898
 *     responses:
 *       200:
 *         description: Información de impacto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ImpactoRuta'
 *             example:
 *               success: true
 *               message: "Impacto calculado exitosamente"
 *               data:
 *                 tiempoAdicional: 15
 *                 distanciaAdicional: 3.2
 *                 nivelImpacto: "MEDIO"
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Datos de coordenadas inválidos: falta origen o destino"
 *       500:
 *         description: Error del servidor
 */ 
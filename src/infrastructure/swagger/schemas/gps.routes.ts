/**
 * @swagger
 * /gps/ubicacion/{equipoId}:
 *   get:
 *     summary: Obtiene la ubicación actual de un equipo
 *     tags: [GPS]
 *     parameters:
 *       - in: path
 *         name: equipoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo
 *         example: "equipo-001"
 *     responses:
 *       200:
 *         description: Ubicación GPS actual o mensaje informativo
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
 *                   $ref: '#/components/schemas/GpsUbicacion'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Ubicación GPS actual"
 *                   data:
 *                     equipoId: "equipo-001"
 *                     latitud: 4.624335
 *                     longitud: -74.063644
 *                     velocidad: 35.5
 *                     timestamp: "2023-11-15T14:30:00Z"
 *               not-found:
 *                 value:
 *                   success: false
 *                   message: "Equipo no encontrado"
 *                   data: null
 *       500:
 *         description: Error del servidor
 * 
 * /gps/historico/{equipoId}:
 *   get:
 *     summary: Obtiene el historial de ubicaciones GPS de un equipo
 *     tags: [GPS]
 *     parameters:
 *       - in: path
 *         name: equipoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo
 *         example: "equipo-001"
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha y hora de inicio (ISO 8601)
 *         example: "2023-11-14T00:00:00Z"
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha y hora de fin (ISO 8601)
 *         example: "2023-11-15T23:59:59Z"
 *     responses:
 *       200:
 *         description: Historial de ubicaciones GPS
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GpsUbicacion'
 *             example:
 *               success: true
 *               message: "Se encontraron 3 registros GPS"
 *               data:
 *                 - equipoId: "equipo-001"
 *                   latitud: 4.624335
 *                   longitud: -74.063644
 *                   velocidad: 35.5
 *                   timestamp: "2023-11-15T12:30:00Z"
 *                 - equipoId: "equipo-001"
 *                   latitud: 4.628974
 *                   longitud: -74.058762
 *                   velocidad: 42.1
 *                   timestamp: "2023-11-15T13:00:00Z"
 *                 - equipoId: "equipo-001"
 *                   latitud: 4.635621
 *                   longitud: -74.051834
 *                   velocidad: 28.3
 *                   timestamp: "2023-11-15T13:30:00Z"
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)"
 *       404:
 *         description: Equipo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Equipo no encontrado"
 *       500:
 *         description: Error del servidor
 * 
 * /gps/ubicacion:
 *   post:
 *     summary: Registra una nueva ubicación GPS para un equipo
 *     description: Registra la posición actual de un equipo incluyendo latitud, longitud y velocidad
 *     tags: [GPS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipoId
 *               - latitud
 *               - longitud
 *               - velocidad
 *             properties:
 *               equipoId:
 *                 type: string
 *                 description: ID del equipo
 *               latitud:
 *                 type: number
 *                 format: float
 *                 description: Latitud en grados decimales
 *               longitud:
 *                 type: number
 *                 format: float
 *                 description: Longitud en grados decimales
 *               velocidad:
 *                 type: number
 *                 format: float
 *                 description: Velocidad en km/h
 *           example:
 *             equipoId: "equipo-001"
 *             latitud: 4.624335
 *             longitud: -74.063644
 *             velocidad: 35.5
 *     responses:
 *       201:
 *         description: Ubicación GPS registrada exitosamente
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
 *                   $ref: '#/components/schemas/GpsUbicacion'
 *             example:
 *               success: true
 *               message: "Ubicación GPS registrada correctamente"
 *               data:
 *                 id: "gps-12345"
 *                 equipoId: "equipo-001"
 *                 latitud: 4.624335
 *                 longitud: -74.063644
 *                 velocidad: 35.5
 *                 timestamp: "2023-11-15T14:30:00Z"
 *                 createdAt: "2023-11-15T14:30:00Z"
 *       400:
 *         description: Datos inválidos o incompletos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Datos de ubicación inválidos"
 *       404:
 *         description: Equipo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Equipo no encontrado"
 *       500:
 *         description: Error interno del servidor
 */ 
/**
 * @swagger
 * /api/eventos:
 *   post:
 *     summary: Registrar un nuevo evento inesperado
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CrearEventoRequest'
 *     responses:
 *       201:
 *         description: Evento registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *             example:
 *               id: "ev-001"
 *               tipo: "TRAFICO"
 *               descripcion: "Cierre vial por manifestación"
 *               latitud: 4.6782
 *               longitud: -74.0582
 *               ciudadId: "ciudad-001"
 *               equipoId: "equipo-001"
 *               impacto: "ALTO"
 *               fecha: "2023-11-15T10:30:00Z"
 *               activo: true
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Datos de entrada inválidos"
 *               details: "El tipo debe ser uno de los siguientes valores: TRAFICO, CLIMA, VEHICULO, CANCELACION, OTRO"
 *       401:
 *         description: No autorizado, token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token inválido o expirado"
 *       403:
 *         description: Prohibido, el usuario no tiene permisos suficientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No tiene permiso para acceder a este recurso"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error interno del servidor"
 * 
 * /api/eventos/activos:
 *   get:
 *     summary: Obtener todos los eventos activos
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de eventos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Evento'
 *             example:
 *               - id: "ev-001"
 *                 tipo: "TRAFICO"
 *                 descripcion: "Cierre vial por manifestación"
 *                 latitud: 4.6782
 *                 longitud: -74.0582
 *                 ciudadId: "ciudad-001"
 *                 equipoId: "equipo-001"
 *                 impacto: "ALTO"
 *                 fecha: "2023-11-15T10:30:00Z"
 *                 activo: true
 *               - id: "ev-002"
 *                 tipo: "CLIMA"
 *                 descripcion: "Inundaciones por fuertes lluvias"
 *                 latitud: 4.6912
 *                 longitud: -74.0653
 *                 ciudadId: "ciudad-001"
 *                 equipoId: null
 *                 impacto: "MEDIO"
 *                 fecha: "2023-11-15T11:15:00Z"
 *                 activo: true
 *       401:
 *         description: No autorizado, token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token inválido o expirado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error interno del servidor"
 * 
 * /api/eventos/ciudad/{ciudadId}:
 *   get:
 *     summary: Obtener eventos de una ciudad específica
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
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
 *         description: Lista de eventos de la ciudad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Evento'
 *             example:
 *               - id: "ev-001"
 *                 tipo: "TRAFICO"
 *                 descripcion: "Cierre vial por manifestación"
 *                 latitud: 4.6782
 *                 longitud: -74.0582
 *                 ciudadId: "ciudad-001"
 *                 equipoId: "equipo-001"
 *                 impacto: "ALTO"
 *                 fecha: "2023-11-15T10:30:00Z"
 *                 activo: true
 *               - id: "ev-002"
 *                 tipo: "CLIMA"
 *                 descripcion: "Inundaciones por fuertes lluvias"
 *                 latitud: 4.6912
 *                 longitud: -74.0653
 *                 ciudadId: "ciudad-001"
 *                 equipoId: null
 *                 impacto: "MEDIO"
 *                 fecha: "2023-11-15T11:15:00Z"
 *                 activo: true
 *       401:
 *         description: No autorizado, token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token inválido o expirado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error interno del servidor"
 * 
 * /api/eventos/equipo/{equipoId}:
 *   get:
 *     summary: Obtener eventos asociados a un equipo
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
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
 *         description: Lista de eventos del equipo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Evento'
 *             example:
 *               - id: "ev-001"
 *                 tipo: "TRAFICO"
 *                 descripcion: "Cierre vial por manifestación"
 *                 latitud: 4.6782
 *                 longitud: -74.0582
 *                 ciudadId: "ciudad-001"
 *                 equipoId: "equipo-001"
 *                 impacto: "ALTO"
 *                 fecha: "2023-11-15T10:30:00Z"
 *                 activo: true
 *               - id: "ev-003"
 *                 tipo: "VEHICULO"
 *                 descripcion: "Falla mecánica por sobrecalentamiento"
 *                 latitud: 4.6523
 *                 longitud: -74.0789
 *                 ciudadId: "ciudad-001"
 *                 equipoId: "equipo-001"
 *                 impacto: "ALTO"
 *                 fecha: "2023-11-15T12:30:00Z"
 *                 activo: true
 *       401:
 *         description: No autorizado, token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token inválido o expirado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error interno del servidor"
 * 
 * /api/eventos/{id}/inactivar:
 *   put:
 *     summary: Marcar un evento como inactivo
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento a inactivar
 *         example: "ev-001"
 *     responses:
 *       200:
 *         description: Evento inactivado exitosamente o mensaje informativo
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Evento'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                       description: Mensaje informativo (Evento no encontrado, etc)
 *             examples:
 *               success:
 *                 value:
 *                   id: "ev-001"
 *                   tipo: "TRAFICO"
 *                   descripcion: "Cierre vial por manifestación"
 *                   latitud: 4.6782
 *                   longitud: -74.0582
 *                   ciudadId: "ciudad-001"
 *                   equipoId: "equipo-001"
 *                   impacto: "ALTO"
 *                   fecha: "2023-11-15T10:30:00Z"
 *                   activo: false
 *               not-found:
 *                 value:
 *                   success: false
 *                   message: "Evento no encontrado"
 *       401:
 *         description: No autorizado, token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token inválido o expirado"
 *       403:
 *         description: Prohibido, el usuario no tiene permisos suficientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No tiene permiso para acceder a este recurso"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error interno del servidor"
 */ 
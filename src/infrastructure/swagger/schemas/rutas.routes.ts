/**
 * @swagger
 * /rutas/optimizar/{equipoId}:
 *   get:
 *     summary: Calcular la ruta óptima para un equipo
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: equipoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo para el que se optimizará la ruta
 *         example: "equipo-001"
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para la que se optimizará la ruta (formato YYYY-MM-DD). Por defecto es la fecha actual.
 *         example: "2023-11-15"
 *     responses:
 *       200:
 *         description: Ruta optimizada o mensaje informativo
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Ruta'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                       description: Mensaje informativo (No hay envíos pendientes, Equipo no encontrado, etc)
 *             examples:
 *               success:
 *                 value:
 *                   id: "ruta-001"
 *                   equipoId: "equipo-001"
 *                   fecha: "2023-11-15"
 *                   estado: "PLANIFICADA"
 *                   distanciaTotal: 35.4
 *                   tiempoEstimado: 120
 *                   replanificada: false
 *                   ultimoEventoId: null
 *                   envios: [
 *                     {
 *                       id: "env-001",
 *                       guia: "GU12345",
 *                       direccionDestino: "Calle 100 #15-20",
 *                       latitudDestino: 4.6871,
 *                       longitudDestino: -74.0426,
 *                       ordenEntrega: 1,
 *                       slaId: "sla-001",
 *                       prioridadSla: 1
 *                     },
 *                     {
 *                       id: "env-002",
 *                       guia: "GU12346",
 *                       direccionDestino: "Carrera 7 #72-41",
 *                       latitudDestino: 4.6582,
 *                       longitudDestino: -74.0536,
 *                       ordenEntrega: 2,
 *                       slaId: "sla-002",
 *                       prioridadSla: 2
 *                     }
 *                   ]
 *               no-envios:
 *                 value:
 *                   success: false
 *                   message: "No hay envíos pendientes para este equipo en la fecha especificada"
 *               equipo-no-encontrado:
 *                 value:
 *                   success: false
 *                   message: "Equipo no encontrado"
 *       400:
 *         description: Error en los parámetros de la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Datos de entrada inválidos"
 *               details: "El formato de fecha es inválido. Use YYYY-MM-DD"
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
 * /rutas/replanificar/{equipoId}:
 *   put:
 *     summary: Replanificar la ruta de un equipo debido a un evento inesperado
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: equipoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo para el que se replanificará la ruta
 *         example: "equipo-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplanificarRutaRequest'
 *     responses:
 *       200:
 *         description: Ruta replanificada o mensaje informativo
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Ruta'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                       description: Mensaje informativo (El evento ya no está activo, No hay envíos pendientes, etc)
 *             examples:
 *               success:
 *                 value:
 *                   id: "ruta-001"
 *                   equipoId: "equipo-001"
 *                   fecha: "2023-11-15"
 *                   estado: "EN_PROGRESO"
 *                   distanciaTotal: 38.7
 *                   tiempoEstimado: 135
 *                   replanificada: true
 *                   ultimoEventoId: "ev-001"
 *                   envios: [
 *                     {
 *                       id: "env-002",
 *                       guia: "GU12346",
 *                       direccionDestino: "Carrera 7 #72-41",
 *                       latitudDestino: 4.6582,
 *                       longitudDestino: -74.0536,
 *                       ordenEntrega: 1,
 *                       slaId: "sla-002",
 *                       prioridadSla: 2
 *                     },
 *                     {
 *                       id: "env-001",
 *                       guia: "GU12345",
 *                       direccionDestino: "Calle 100 #15-20",
 *                       latitudDestino: 4.6871,
 *                       longitudDestino: -74.0426,
 *                       ordenEntrega: 2,
 *                       slaId: "sla-001",
 *                       prioridadSla: 1
 *                     }
 *                   ]
 *               evento-inactivo:
 *                 value:
 *                   success: false
 *                   message: "El evento ya no está activo"
 *               ruta-ya-replanificada:
 *                 value:
 *                   success: false
 *                   message: "Esta ruta ya fue replanificada por este evento"
 *       400:
 *         description: Error en los parámetros de la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Datos de entrada inválidos"
 *               details: "El evento ID es requerido"
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
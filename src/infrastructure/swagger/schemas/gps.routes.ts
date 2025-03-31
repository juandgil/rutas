/**
 * @swagger
 * /gps/sincronizar_ubicacion:
 *   post:
 *     summary: Sincroniza las ubicaciones actuales de todos los equipos desde los registros GPS
 *     description: Este endpoint debe ser llamado cada 5 minutos por Cloud Scheduler para mantener actualizada la tabla equipos_ubicacion_actual
 *     tags: [GPS]
 *     responses:
 *       200:
 *         description: Ubicaciones sincronizadas exitosamente
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
 *                   type: object
 *                   properties:
 *                     equiposSincronizados:
 *                       type: integer
 *                       description: Número de equipos cuyas ubicaciones fueron sincronizadas
 *                     equipos:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Lista de IDs de equipos sincronizados
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Ubicaciones sincronizadas exitosamente"
 *                   data:
 *                     equiposSincronizados: 4
 *                     equipos: ["equipo-001", "equipo-002", "equipo-003", "equipo-004"]
 *               no-equipos:
 *                 value:
 *                   success: true
 *                   message: "No hay equipos activos para sincronizar"
 *                   data:
 *                     equiposSincronizados: 0
 *       500:
 *         description: Error del servidor
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
 *                   type: null
 *             example:
 *               success: false
 *               message: "Error al sincronizar ubicaciones GPS"
 *               data: null
 * 
 * /gps/generar_datos_prueba:
 *   post:
 *     summary: Genera datos de prueba para las ubicaciones GPS
 *     description: Solo para entorno de desarrollo. Crea registros GPS ficticios para equipos de prueba.
 *     tags: [GPS]
 *     responses:
 *       200:
 *         description: Datos de prueba generados exitosamente
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
 *                   type: object
 *                   properties:
 *                     equipos:
 *                       type: array
 *                       items:
 *                         type: string
 *                     registrosPorEquipo:
 *                       type: integer
 *                     totalRegistros:
 *                       type: integer
 *             example:
 *               success: true
 *               message: "Datos de prueba generados exitosamente"
 *               data:
 *                 equipos: ["equipo-001", "equipo-002"]
 *                 registrosPorEquipo: 100
 *                 totalRegistros: 200
 *       400:
 *         description: Datos inválidos o equipo no encontrado
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
 *                   type: null
 *             example:
 *               success: false
 *               message: "Equipo equipo-999 no encontrado"
 *               data: null
 *       500:
 *         description: Error interno del servidor
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
 *                   type: null
 *             example:
 *               success: false
 *               message: "Error al generar datos de prueba para GPS"
 *               data: null
 */ 
/**
 * @swagger
 * /admin/reset-test-data:
 *   post:
 *     summary: Reinicia los datos para pruebas de optimización y replanificación
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos reiniciados exitosamente
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
 *                     enviosReiniciados:
 *                       type: boolean
 *                     rutasEliminadas:
 *                       type: boolean
 *                     ubicacionesActualizadas:
 *                       type: boolean
 *             example:
 *               success: true
 *               message: "Datos de prueba reiniciados exitosamente"
 *               data:
 *                 enviosReiniciados: true
 *                 rutasEliminadas: true
 *                 ubicacionesActualizadas: true
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
 *         description: Error al reiniciar datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error al reiniciar datos de prueba"
 */ 
/**
 * @swagger
 * /api/vehiculos/{id}:
 *   get:
 *     summary: Obtiene información detallada de un vehículo
 *     tags: [Vehiculos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vehículo
 *         example: "vehiculo-001"
 *     responses:
 *       200:
 *         description: Información del vehículo o mensaje informativo
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
 *                   $ref: '#/components/schemas/VehiculoInfo'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Vehículo encontrado"
 *                   data:
 *                     id: "vehiculo-001"
 *                     placa: "ABC123"
 *                     modelo: "Furgón 2023"
 *                     tipo: "FURGONETA"
 *                     capacidad:
 *                       pesoMaximo: 1500
 *                       volumenMaximo: 8.5
 *                     estado:
 *                       disponible: true
 *                       ultimoMantenimiento: "2023-10-20T08:30:00Z"
 *               not-found:
 *                 value:
 *                   success: false
 *                   message: "Vehículo no encontrado"
 *                   data: null
 *       401:
 *         description: No autorizado, token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token inválido o expirado"
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error interno del servidor"
 * 
 * /api/vehiculos:
 *   get:
 *     summary: Obtiene lista de vehículos
 *     tags: [Vehiculos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos
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
 *                     $ref: '#/components/schemas/VehiculoInfo'
 *             example:
 *               success: true
 *               message: "Lista de vehículos"
 *               data:
 *                 - id: "vehiculo-001"
 *                   placa: "ABC123"
 *                   modelo: "Furgón 2023"
 *                   tipo: "FURGONETA"
 *                   capacidad:
 *                     pesoMaximo: 1500
 *                     volumenMaximo: 8.5
 *                   estado:
 *                     disponible: true
 *                 - id: "vehiculo-002"
 *                   placa: "DEF456"
 *                   modelo: "Camión 2022"
 *                   tipo: "CAMION"
 *                   capacidad:
 *                     pesoMaximo: 3500
 *                     volumenMaximo: 15.2
 *                   estado:
 *                     disponible: true
 *       401:
 *         description: No autorizado, token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Token inválido o expirado"
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Error interno del servidor"
 */ 
/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
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
 *           description: Datos de respuesta
 *           nullable: true
 *     
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Descripción del error
 *         details:
 *           type: string
 *           description: Detalles adicionales del error
 *           nullable: true
 * 
 *     Coordenadas:
 *       type: object
 *       properties:
 *         latitud:
 *           type: number
 *           format: float
 *           description: Latitud en grados decimales
 *         longitud:
 *           type: number
 *           format: float
 *           description: Longitud en grados decimales
 *       example:
 *         latitud: 4.624335
 *         longitud: -74.063644
 */ 
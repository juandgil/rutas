/**
 * @swagger
 * components:
 *   schemas:
 *     Vehiculo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del vehículo
 *         placa:
 *           type: string
 *           description: Placa del vehículo
 *         modelo:
 *           type: string
 *           description: Modelo del vehículo
 *         tipo:
 *           type: string
 *           description: Tipo de vehículo (camión, furgoneta, etc.)
 *         capacidadPeso:
 *           type: number
 *           format: float
 *           description: Capacidad de carga en kg
 *         capacidadVolumen:
 *           type: number
 *           format: float
 *           description: Capacidad de volumen en m³
 *         disponible:
 *           type: boolean
 *           description: Indica si el vehículo está disponible
 *         fechaAdquisicion:
 *           type: string
 *           format: date
 *           description: Fecha de adquisición del vehículo
 *       example:
 *         id: "vehiculo-001"
 *         placa: "ABC123"
 *         modelo: "Furgón 2023"
 *         tipo: "FURGONETA"
 *         capacidadPeso: 1500
 *         capacidadVolumen: 8.5
 *         disponible: true
 *         fechaAdquisicion: "2023-01-15"
 *     
 *     VehiculoInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del vehículo
 *         placa:
 *           type: string
 *           description: Placa del vehículo
 *         modelo:
 *           type: string
 *           description: Modelo del vehículo
 *         tipo:
 *           type: string
 *           description: Tipo de vehículo
 *         capacidad:
 *           type: object
 *           properties:
 *             pesoMaximo:
 *               type: number
 *               format: float
 *               description: Capacidad máxima de carga en kg
 *             volumenMaximo:
 *               type: number
 *               format: float
 *               description: Capacidad máxima de volumen en m³
 *         estado:
 *           type: object
 *           properties:
 *             disponible:
 *               type: boolean
 *               description: Disponibilidad actual
 *             ultimoMantenimiento:
 *               type: string
 *               format: date-time
 *               description: Fecha del último mantenimiento
 *       example:
 *         id: "vehiculo-001"
 *         placa: "ABC123"
 *         modelo: "Furgón 2023"
 *         tipo: "FURGONETA"
 *         capacidad:
 *           pesoMaximo: 1500
 *           volumenMaximo: 8.5
 *         estado:
 *           disponible: true
 *           ultimoMantenimiento: "2023-10-20T08:30:00Z"
 */ 
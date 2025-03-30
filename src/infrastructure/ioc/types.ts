// Definir los tipos para inyección de dependencias
const TYPES = {
  // Repositories
  IEquipoRepository: Symbol.for('IEquipoRepository'),
  IVehiculoRepository: Symbol.for('IVehiculoRepository'),
  IEnvioRepository: Symbol.for('IEnvioRepository'),
  IRutaRepository: Symbol.for('IRutaRepository'),
  IEventoRepository: Symbol.for('IEventoRepository'),
  IGpsRepository: Symbol.for('IGpsRepository'),
  ISlaRepository: Symbol.for('ISlaRepository'),

  // Services
  IAuthService: Symbol.for('IAuthService'),
  IRutaService: Symbol.for('IRutaService'),
  IOptimizacionService: Symbol.for('IOptimizacionService'),
  IEventoService: Symbol.for('IEventoService'),
  IPubSubService: Symbol.for('IPubSubService'),
  ICacheService: Symbol.for('ICacheService'),
  
  // Infrastructure Services
  Logger: Symbol.for('Logger'),

  // External APIs
  IGpsApi: Symbol.for('IGpsApi'),
  ITraficoClimaApi: Symbol.for('ITraficoClimaApi'),
  IVehiculoApi: Symbol.for('IVehiculoApi'),

  // Database
  IDatabase: Symbol.for('IDatabase'),

  // Manejadores de mensajes
  PubSubMessageHandlers: Symbol.for('PubSubMessageHandlers'),

  // Controladores
  GpsController: Symbol.for('GpsController'),
  RutasController: Symbol.for('RutasController'),
  EventosController: Symbol.for('EventosController'),
  AuthController: Symbol.for('AuthController'),
  TraficoClimaController: Symbol.for('TraficoClimaController'),
  AdminController: Symbol.for('AdminController')
};

export { TYPES }; 
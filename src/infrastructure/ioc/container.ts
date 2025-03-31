import { Container } from 'inversify';
import { TYPES } from './types';

// Interfaces y sus implementaciones
import { IGpsRepository } from '../../domain/repositories/gps.repository';
import { GpsRepository } from '../repositories/gps.repository.impl';

import { IEquipoRepository } from '../../domain/repositories/equipo.repository';
import { EquipoRepository } from '../repositories/equipo.repository.impl';

import { IRutaRepository } from '../../domain/repositories/ruta.repository';
import { RutaRepository } from '../repositories/ruta.repository.impl';

import { IEnvioRepository } from '../../domain/repositories/envio.repository';
import { EnvioRepository } from '../repositories/envio.repository.impl';

import { ISlaRepository } from '../../domain/repositories/sla.repository';
import { SlaRepository } from '../repositories/sla.repository.impl';

import { IVehiculoRepository } from '../../domain/repositories/vehiculo.repository';
import { VehiculoRepository } from '../repositories/vehiculo.repository.impl';

import { IEventoRepository } from '../../domain/repositories/evento.repository';
import { EventoRepository } from '../repositories/evento.repository.impl';

import { ITraficoClimaApi } from '../../application/interfaces/trafico-clima-api.interface';
import { TraficoClimaApiMock } from '../external-apis/trafico-clima-api.mock';

import { IOptimizacionService } from '../../application/interfaces/optimizacion-service.interface';
import { OptimizacionService } from '../../application/services/optimizacion.service';

import { IEventoService } from '../../application/interfaces/evento-service.interface';
import { EventoService } from '../../application/services/evento.service';

import { IAuthService } from '../../application/interfaces/auth-service.interface';
import { AuthService } from '../../application/services/auth.service';

import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { GoogleCloudPubSubService } from '../pubsub/google-cloud-pubsub.service';
import { InMemoryPubSubService } from '../pubsub/pubsub.service';

import { PubSubMessageHandlers } from '../pubsub/message-handlers';

// Logger
import { ILogger } from '../../interfaces/services/logger.interface';
import { LoggerService } from '../../infrastructure/services/logger.service';

// Controllers
import { GpsController } from '../../interfaces/controllers/gps.controller';
import { RutasController } from '../../interfaces/controllers/rutas.controller';
import { EventosController } from '../../interfaces/controllers/eventos.controller';
import { AuthController } from '../../interfaces/controllers/auth.controller';
import { TraficoClimaController } from '../../interfaces/controllers/trafico-clima.controller';
import { AdminController } from '../../interfaces/controllers/admin.controller';


import { IDatabase, Database } from '../database/database';


import { ICacheService, RedisCache } from '../cache/redis-client';


import { IGpsApi } from '../../domain/interfaces/external-apis.interface';
import { GpsApiMock } from '../external-apis/gps-api.mock';


import { IVehiculoApi } from '../../domain/interfaces/external-apis.interface';
import { VehiculoApiMock } from '../external-apis/vehiculo-api.mock';

// Agregar la siguiente línea en las importaciones
import { ITraficoClimaService } from '../../application/interfaces/trafico-clima-service.interface';
import { TraficoClimaService } from '../../application/services/trafico-clima.service';

// Crear el contenedor IoC
const container = new Container();

// Registrar servicios de infraestructura
container.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();

// Registrar repositorios
container.bind<IGpsRepository>(TYPES.IGpsRepository).to(GpsRepository).inSingletonScope();
container.bind<IEquipoRepository>(TYPES.IEquipoRepository).to(EquipoRepository).inSingletonScope();
container.bind<IRutaRepository>(TYPES.IRutaRepository).to(RutaRepository).inSingletonScope();
container.bind<IEnvioRepository>(TYPES.IEnvioRepository).to(EnvioRepository).inSingletonScope();
container.bind<ISlaRepository>(TYPES.ISlaRepository).to(SlaRepository).inSingletonScope();
container.bind<IVehiculoRepository>(TYPES.IVehiculoRepository).to(VehiculoRepository).inSingletonScope();
container.bind<IEventoRepository>(TYPES.IEventoRepository).to(EventoRepository).inSingletonScope();

// Registrar APIs externas
container.bind<ITraficoClimaApi>(TYPES.ITraficoClimaApi).to(TraficoClimaApiMock).inSingletonScope();
container.bind<IGpsApi>(TYPES.IGpsApi).to(GpsApiMock).inSingletonScope();
container.bind<IVehiculoApi>(TYPES.IVehiculoApi).to(VehiculoApiMock).inSingletonScope();

// Registrar servicios
container.bind<IOptimizacionService>(TYPES.IOptimizacionService).to(OptimizacionService).inSingletonScope();
container.bind<IEventoService>(TYPES.IEventoService).to(EventoService).inSingletonScope();
container.bind<IAuthService>(TYPES.IAuthService).to(AuthService).inSingletonScope();

// Registrar manejador de mensajes PubSub
container.bind<PubSubMessageHandlers>(TYPES.PubSubMessageHandlers).to(PubSubMessageHandlers).inSingletonScope();

// Registrar controladores
container.bind<GpsController>(TYPES.GpsController).to(GpsController);
container.bind<RutasController>(TYPES.RutasController).to(RutasController);
container.bind<EventosController>(TYPES.EventosController).to(EventosController);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<TraficoClimaController>(TYPES.TraficoClimaController).to(TraficoClimaController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);


container.bind<IDatabase>(TYPES.IDatabase).to(Database).inSingletonScope();

container.bind<ICacheService>(TYPES.ICacheService).to(RedisCache).inSingletonScope();

// Cambiar esta vinculación para usar el servicio adecuado según el entorno
if (process.env.NODE_ENV === 'development') {
  container.bind<IPubSubService>(TYPES.IPubSubService).to(InMemoryPubSubService).inSingletonScope();
} else {
  container.bind<IPubSubService>(TYPES.IPubSubService).to(GoogleCloudPubSubService).inSingletonScope();
}

// Y luego agregar este binding en la función de configuración del contenedor
container.bind<ITraficoClimaService>(TYPES.ITraficoClimaService).to(TraficoClimaService).inSingletonScope();

export { container }; 
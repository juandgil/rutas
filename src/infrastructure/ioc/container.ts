import { Container } from 'inversify';
import { TYPES } from './types';

// Servicios de aplicación
import { IAuthService } from '../../application/interfaces/auth-service.interface';
import { IOptimizacionService } from '../../application/interfaces/optimizacion-service.interface';
import { IEventoService } from '../../application/interfaces/evento-service.interface';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { AuthService, EventoService, OptimizacionService } from '../../application/services';

// Repositorios
import { IEquipoRepository, IVehiculoRepository, IEnvioRepository, IRutaRepository, 
         IEventoRepository, IGpsRepository, ISlaRepository } from '../../domain/repositories';
import { EquipoRepository, VehiculoRepository, EnvioRepository, RutaRepository,
         EventoRepository, GpsRepository, SlaRepository } from '../repositories';

// Infraestructura
import { IDatabase, Database } from '../database/database';
import { ICacheService, RedisCache } from '../cache/redis-client';
import { InMemoryPubSubService } from '../pubsub/pubsub.service';

// Controladores (para que inversify-express-utils los detecte)
import '../../interfaces/controllers';

// Importar interfaces y mocks de APIs externas
import { IGpsApi, ITraficoClimaApi, IVehiculoApi } from '../../domain/interfaces/external-apis.interface';
import { GpsApiMock } from '../external-apis/gps-api.mock';
import { TraficoClimaApiMock } from '../external-apis/trafico-clima-api.mock';
import { VehiculoApiMock } from '../external-apis/vehiculo-api.mock';

// Crear el contenedor IoC
const container = new Container();

// Registrar servicios
container.bind<IAuthService>(TYPES.IAuthService).to(AuthService);
container.bind<IOptimizacionService>(TYPES.IOptimizacionService).to(OptimizacionService);
container.bind<IEventoService>(TYPES.IEventoService).to(EventoService);
container.bind<IPubSubService>(TYPES.IPubSubService).to(InMemoryPubSubService).inSingletonScope();

// Registrar repositorios
container.bind<IEquipoRepository>(TYPES.IEquipoRepository).to(EquipoRepository);
container.bind<IVehiculoRepository>(TYPES.IVehiculoRepository).to(VehiculoRepository);
container.bind<IEnvioRepository>(TYPES.IEnvioRepository).to(EnvioRepository);
container.bind<IRutaRepository>(TYPES.IRutaRepository).to(RutaRepository);
container.bind<IEventoRepository>(TYPES.IEventoRepository).to(EventoRepository);
container.bind<IGpsRepository>(TYPES.IGpsRepository).to(GpsRepository);
container.bind<ISlaRepository>(TYPES.ISlaRepository).to(SlaRepository);

// Registrar infraestructura
container.bind<IDatabase>(TYPES.IDatabase).to(Database).inSingletonScope();
container.bind<ICacheService>(TYPES.ICacheService).to(RedisCache).inSingletonScope();

// Registrar APIs externas
container.bind<IGpsApi>(TYPES.IGpsApi).to(GpsApiMock).inSingletonScope();
container.bind<ITraficoClimaApi>(TYPES.ITraficoClimaApi).to(TraficoClimaApiMock).inSingletonScope();
container.bind<IVehiculoApi>(TYPES.IVehiculoApi).to(VehiculoApiMock).inSingletonScope();

export { container }; 
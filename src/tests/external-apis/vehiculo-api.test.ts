import 'reflect-metadata';
import { VehiculoApiMock } from '../../infrastructure/external-apis/vehiculo-api.mock';
import { TipoVehiculo, CapacidadVehiculo, DisponibilidadVehiculo } from '../../domain/interfaces/external-apis.interface';
import { ICacheService } from '../../infrastructure/cache/redis-client';
import axios from 'axios';

// Mocks
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock para ICacheService
const cacheServiceMock: jest.Mocked<ICacheService> = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn()
};

describe('VehiculoApiMock', () => {
  let vehiculoApi: VehiculoApiMock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Iniciamos la API de vehículos con el mock del servicio de caché
    vehiculoApi = new VehiculoApiMock(cacheServiceMock);
  });
  
  describe('obtenerCapacidad', () => {
    it('debería retornar la capacidad desde la caché si está disponible', async () => {
      // Configuramos el mock para simular datos en caché
      const capacidadCached: CapacidadVehiculo = {
        vehiculoId: 'vehiculo-001',
        tipo: TipoVehiculo.FURGON,
        pesoMaximo: 1500,
        volumenMaximo: 12.5
      };
      
      cacheServiceMock.get.mockResolvedValueOnce(capacidadCached);
      
      // Realizamos la petición
      const resultado = await vehiculoApi.obtenerCapacidad('vehiculo-001');
      
      // Verificamos que se consultó la caché
      expect(cacheServiceMock.get).toHaveBeenCalledWith('vehiculo:capacidad:vehiculo-001');
      
      // Verificamos que no se realizó la petición HTTP
      expect(mockedAxios.get).not.toHaveBeenCalled();
      
      // Verificamos el resultado
      expect(resultado).toEqual(capacidadCached);
    });
    
    it('debería consultar la API y guardar en caché si no hay datos en caché', async () => {
      // No hay datos en caché
      cacheServiceMock.get.mockResolvedValueOnce(null);
      
      // Simulamos respuesta de la API
      const apiResponse = {
        data: {
          success: true,
          data: {
            id: 'vehiculo-001',
            tipo: 'furgon',
            capacidad: {
              pesoMaximo: 1800,
              volumenMaximo: 14.2
            },
            estado: {
              disponible: true
            }
          }
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(apiResponse);
      
      // Realizamos la petición
      const resultado = await vehiculoApi.obtenerCapacidad('vehiculo-001');
      
      // Verificamos que se consultó la caché
      expect(cacheServiceMock.get).toHaveBeenCalledWith('vehiculo:capacidad:vehiculo-001');
      
      // Verificamos que se realizó la petición HTTP
      expect(mockedAxios.get).toHaveBeenCalled();
      
      // Verificamos que se guardó en caché
      expect(cacheServiceMock.set).toHaveBeenCalledWith(
        'vehiculo:capacidad:vehiculo-001',
        expect.objectContaining({
          vehiculoId: 'vehiculo-001',
          tipo: TipoVehiculo.FURGON,
          pesoMaximo: 1800,
          volumenMaximo: 14.2
        }),
        expect.any(Number)
      );
      
      // Verificamos el resultado
      expect(resultado).toEqual({
        vehiculoId: 'vehiculo-001',
        tipo: TipoVehiculo.FURGON,
        pesoMaximo: 1800,
        volumenMaximo: 14.2
      });
    });
    
    it('debería manejar errores y devolver capacidad por defecto', async () => {
      // No hay datos en caché
      cacheServiceMock.get.mockResolvedValueOnce(null);
      
      // Error en la API
      mockedAxios.get.mockRejectedValueOnce(new Error('API no disponible'));
      
      // Realizamos la petición
      const resultado = await vehiculoApi.obtenerCapacidad('camion-123');
      
      // Verificamos que se consultó la caché
      expect(cacheServiceMock.get).toHaveBeenCalledWith('vehiculo:capacidad:camion-123');
      
      // Verificamos que se realizó la petición HTTP
      expect(mockedAxios.get).toHaveBeenCalled();
      
      // Verificamos que no se guardó en caché
      expect(cacheServiceMock.set).not.toHaveBeenCalled();
      
      // Verificamos el resultado
      expect(resultado).toHaveProperty('vehiculoId', 'camion-123');
      expect(resultado).toHaveProperty('tipo', TipoVehiculo.CAMION);
      expect(resultado).toHaveProperty('pesoMaximo');
      expect(resultado).toHaveProperty('volumenMaximo');
    });
  });
  
  describe('verificarDisponibilidad', () => {
    it('debería retornar la disponibilidad desde la caché si está disponible', async () => {
      // Configuramos el mock para simular datos en caché
      const disponibilidadCached: DisponibilidadVehiculo = {
        vehiculoId: 'vehiculo-001',
        disponible: true
      };
      
      cacheServiceMock.get.mockResolvedValueOnce(disponibilidadCached);
      
      // Realizamos la petición
      const resultado = await vehiculoApi.verificarDisponibilidad('vehiculo-001');
      
      // Verificamos que se consultó la caché
      expect(cacheServiceMock.get).toHaveBeenCalledWith('vehiculo:disponibilidad:vehiculo-001');
      
      // Verificamos que no se realizó la petición HTTP
      expect(mockedAxios.get).not.toHaveBeenCalled();
      
      // Verificamos el resultado
      expect(resultado).toEqual(disponibilidadCached);
    });
    
    it('debería asumir disponibilidad en caso de error', async () => {
      // No hay datos en caché
      cacheServiceMock.get.mockResolvedValueOnce(null);
      
      // Error en la API
      mockedAxios.get.mockRejectedValueOnce(new Error('API no disponible'));
      
      // Realizamos la petición
      const resultado = await vehiculoApi.verificarDisponibilidad('vehiculo-002');
      
      // Verificamos que se consultó la caché
      expect(cacheServiceMock.get).toHaveBeenCalledWith('vehiculo:disponibilidad:vehiculo-002');
      
      // Verificamos que se realizó la petición HTTP
      expect(mockedAxios.get).toHaveBeenCalled();
      
      // Verificamos que no se guardó en caché
      expect(cacheServiceMock.set).not.toHaveBeenCalled();
      
      // Verificamos el resultado por defecto
      expect(resultado).toEqual({
        vehiculoId: 'vehiculo-002',
        disponible: true
      });
    });
  });
}); 
import 'reflect-metadata';
import { Request, Response } from 'express';
import { GpsController } from '../../interfaces/controllers/gps.controller';
import { IGpsRepository } from '../../domain/repositories/gps.repository';
import { Gps } from '../../domain/entities/gps.entity';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { IEquipoRepository } from '../../domain/repositories/equipo.repository';
import { IDatabase } from '../../infrastructure/database/database';
import { ApiResponse } from '../../interfaces/dtos/common.dto';
import { v4 as uuidv4 } from 'uuid';

// Mocks
jest.mock('../../domain/repositories/gps.repository');
jest.mock('../../domain/repositories/equipo.repository');
jest.mock('../../application/interfaces/pubsub-service.interface');
jest.mock('../../infrastructure/database/database');

describe('GpsController', () => {
  let gpsController: GpsController;
  let gpsRepositoryMock: jest.Mocked<IGpsRepository>;
  let equipoRepositoryMock: jest.Mocked<IEquipoRepository>;
  let pubSubServiceMock: jest.Mocked<IPubSubService>;
  let databaseMock: jest.Mocked<IDatabase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  // Datos de prueba
  const fechaActual = new Date();
  
  const ubicacionesMock: Gps[] = [
    {
      id: 'gps-123',
      equipoId: 'equipo-001',
      latitud: 4.6782,
      longitud: -74.0582,
      timestamp: fechaActual,
      velocidad: 35.5,
      createdAt: fechaActual
    },
    {
      id: 'gps-456',
      equipoId: 'equipo-002',
      latitud: 4.7123,
      longitud: -74.0321,
      timestamp: new Date(fechaActual.getTime() - 10 * 60 * 1000), // 10 minutos antes
      velocidad: 0,
      createdAt: fechaActual
    }
  ];
  
  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Configurar mocks
    gpsRepositoryMock = {
      create: jest.fn().mockImplementation(data => Promise.resolve({ ...data, id: uuidv4() })),
      findByEquipo: jest.fn().mockResolvedValue(ubicacionesMock[0]),
      findUltimaByEquipo: jest.fn().mockResolvedValue(ubicacionesMock[0]),
      findByEquipoYRango: jest.fn().mockResolvedValue(ubicacionesMock),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ ...data, id })),
      delete: jest.fn().mockResolvedValue(true),
      generarDatosPrueba: jest.fn().mockResolvedValue(10),
      sincronizarUbicaciones: jest.fn().mockResolvedValue({
        equiposSincronizados: 2,
        ubicacionesGuardadas: 2
      })
    } as any;
    
    equipoRepositoryMock = {
      findAll: jest.fn().mockResolvedValue([
        { id: 'equipo-001', nombre: 'Equipo 1', vehiculoId: 'vehiculo-001' },
        { id: 'equipo-002', nombre: 'Equipo 2', vehiculoId: 'vehiculo-002' }
      ]),
      findById: jest.fn().mockResolvedValue({ id: 'equipo-001', nombre: 'Equipo 1', vehiculoId: 'vehiculo-001' }),
      updateUbicacion: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockResolvedValue({ id: 'equipo-nuevo', nombre: 'Equipo Nuevo', vehiculoId: 'vehiculo-001' }),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ ...data, id })),
      delete: jest.fn().mockResolvedValue(true)
    } as any;
    
    pubSubServiceMock = {
      publicar: jest.fn().mockResolvedValue(true),
      suscribir: jest.fn()
    } as any;
    
    databaseMock = {
      execute: jest.fn().mockResolvedValue({}),
      query: jest.fn().mockResolvedValue([]),
      transaction: jest.fn().mockImplementation(callback => callback())
    } as any;
    
    // Inicializar controlador con mocks
    gpsController = new GpsController(
      gpsRepositoryMock, 
      equipoRepositoryMock,
      pubSubServiceMock,
      databaseMock
    );
    
    // Mock de Request y Response
    mockRequest = {
      params: {},
      query: {},
      body: {},
      headers: {
        authorization: 'Bearer fake-token'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });
  
  describe('sincronizarUbicacion', () => {
    it('debería sincronizar ubicaciones exitosamente', async () => {
      // Mock de equipos activos
      equipoRepositoryMock.findAll.mockResolvedValue([
        { id: 'equipo-001', nombre: 'Equipo 1', vehiculoId: 'vehiculo-001', ciudadId: 'ciudad-001', disponible: true, transportistas: [] } as any,
        { id: 'equipo-002', nombre: 'Equipo 2', vehiculoId: 'vehiculo-002', ciudadId: 'ciudad-001', disponible: true, transportistas: [] } as any
      ]);
      
      // Mock para registros GPS aleatorios
      databaseMock.query.mockResolvedValue([{
        id: 'gps-123',
        equipoId: 'equipo-001',
        latitud: 4.6782,
        longitud: -74.0582,
        velocidad: 35.5,
        timestamp: new Date()
      }]);
      
      await gpsController.sincronizarUbicacion(mockRequest as Request, mockResponse as Response);
      
      expect(databaseMock.query).toHaveBeenCalled();
      expect(databaseMock.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        new ApiResponse(true, expect.stringContaining('Ubicaciones sincronizadas'), expect.any(Object))
      );
    });
    
    it('debería manejar errores al sincronizar ubicaciones', async () => {
      // Caso de error: Error en la sincronización
      equipoRepositoryMock.findAll.mockResolvedValueOnce([]);
      
      await gpsController.sincronizarUbicacion(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(
        true,
        'No hay equipos activos para sincronizar',
        { equiposSincronizados: 0 }
      ));
    });
  });
  
  describe('generarDatosPrueba', () => {
    it('debería generar datos de prueba exitosamente', async () => {
      // Mock para la verificación de equipos
      equipoRepositoryMock.findById.mockResolvedValue({ 
        id: 'equipo-001', 
        nombre: 'Equipo 1', 
        vehiculoId: 'vehiculo-001', 
        ciudadId: 'ciudad-001', 
        disponible: true, 
        transportistas: [] 
      } as any);
      
      await gpsController.generarDatosPrueba(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Datos de prueba generados exitosamente'
      }));
    });
    
    it('debería manejar errores al generar datos de prueba', async () => {
      // Simular error en la base de datos
      databaseMock.execute.mockRejectedValue(new Error('Error aleatorio'));
      
      await gpsController.generarDatosPrueba(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(
        false,
        'Error al generar datos de prueba para GPS',
        null
      ));
    });
  });
}); 
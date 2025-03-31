import 'reflect-metadata';
import { Request, Response } from 'express';
import { RutasController } from '../../interfaces/controllers/rutas.controller';
import { OptimizacionService } from '../../application/services/optimizacion.service';
import { IEventoService } from '../../application/interfaces/evento-service.interface';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { Ruta, EstadoRuta } from '../../domain/entities/ruta.entity';
import { IRutaRepository } from '../../domain/repositories/ruta.repository';
import { ApiResponse } from '../../interfaces/dtos/common.dto';
import { IEquipoRepository } from '../../domain/repositories/equipo.repository';

// Mocks
jest.mock('../../application/services/optimizacion.service');
jest.mock('../../application/interfaces/evento-service.interface');
jest.mock('../../application/interfaces/pubsub-service.interface');
jest.mock('../../domain/repositories/ruta.repository');
jest.mock('../../domain/repositories/equipo.repository');

describe('RutasController', () => {
  let rutasController: RutasController;
  let optimizacionServiceMock: jest.Mocked<OptimizacionService>;
  let eventoServiceMock: jest.Mocked<IEventoService>;
  let pubSubServiceMock: jest.Mocked<IPubSubService>;
  let rutaRepositoryMock: jest.Mocked<IRutaRepository>;
  let equipoRepositoryMock: jest.Mocked<IEquipoRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  // Datos de prueba
  const fechaPrueba = new Date('2025-03-30');
  
  const rutaMock: Ruta = {
    id: 'ruta-001',
    equipoId: 'equipo-001',
    fecha: fechaPrueba,
    envios: ['envio-001', 'envio-002'],
    estado: EstadoRuta.PLANIFICADA,
    distanciaTotal: 25.5,
    tiempoEstimado: 35,
    replanificada: false,
    ultimoEventoId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Configurar mocks
    optimizacionServiceMock = {
      optimizarRuta: jest.fn().mockResolvedValue(rutaMock),
      replanificarRuta: jest.fn().mockResolvedValue(rutaMock),
      validarReplanificacion: jest.fn().mockResolvedValue(true)
    } as any;
    
    eventoServiceMock = {
      obtenerEvento: jest.fn().mockImplementation((id) => {
        if (id === 'evento-123') {
          return Promise.resolve({
            id: 'evento-123',
            tipo: 'TRAFICO',
            descripcion: 'Cierre vial por manifestación',
            equipoId: 'equipo-001',
            activo: true
          });
        }
        return Promise.resolve(null);
      })
    } as any;
    
    pubSubServiceMock = {
      publicar: jest.fn().mockResolvedValue(true),
      suscribir: jest.fn().mockResolvedValue('subscription-1')
    } as any;
    
    rutaRepositoryMock = {
      findByEquipoAndDate: jest.fn().mockResolvedValue(rutaMock),
      findById: jest.fn().mockResolvedValue(rutaMock),
      create: jest.fn().mockResolvedValue(rutaMock),
      update: jest.fn().mockResolvedValue(rutaMock),
      delete: jest.fn().mockResolvedValue(true)
    } as any;

    equipoRepositoryMock = {
      findById: jest.fn().mockResolvedValue({
        id: 'equipo-001', 
        nombre: 'Equipo 1',
        transportistas: [],
        vehiculoId: 'vehiculo-001',
        disponible: true,
        ciudadId: 'ciudad-001',
        latitud: 4.65,
        longitud: -74.05,
        createdAt: new Date(),
        updatedAt: new Date()
      }),
    } as any;
    
    // Inicializar controlador con mocks
    rutasController = new RutasController(
      pubSubServiceMock,
      optimizacionServiceMock,
      eventoServiceMock,
      rutaRepositoryMock,
      equipoRepositoryMock
    );
    
    // Mock de Request y Response
    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {
        authorization: 'Bearer token-123'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('optimizarRuta', () => {
    it('debería optimizar una ruta exitosamente', async () => {
      mockRequest.params = { equipoId: 'equipo-001' };
      mockRequest.query = { fecha: '2025-03-29' };
      
      // Asegurar que no exista una ruta previa
      rutaRepositoryMock.findByEquipoAndDate.mockResolvedValueOnce(null);
      
      await rutasController.optimizarRuta(mockRequest as Request, mockResponse as Response);
      
      expect(optimizacionServiceMock.optimizarRuta).toHaveBeenCalledWith('equipo-001', expect.any(Date));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(true, expect.stringContaining('Ruta optimizada'), expect.objectContaining({
        id: 'ruta-001',
        equipoId: 'equipo-001'
      })));
    });
    
    it('debería manejar errores al optimizar ruta', async () => {
      mockRequest.params = { equipoId: 'equipo-invalido' };
      mockRequest.query = { fecha: '2025-03-29' };
      
      // Simular que el equipo no existe
      equipoRepositoryMock.findById.mockResolvedValueOnce(null);
      
      await rutasController.optimizarRuta(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(false, 'Equipo no encontrado', null));
    });
  });
  
  describe('replanificarRuta', () => {
    it('debería replanificar la ruta exitosamente', async () => {
      mockRequest.params = { equipoId: 'equipo-001' };
      mockRequest.body = { eventoId: 'evento-123' };
      
      // Mock del método waitForResult
      (rutasController as any).waitForResult = jest.fn().mockResolvedValueOnce({
        success: true,
        ruta: rutaMock
      });
      
      // Simular que el equipo existe
      equipoRepositoryMock.findById.mockResolvedValueOnce({
        id: 'equipo-001', 
        nombre: 'Equipo 1',
        transportistas: [],
        vehiculoId: 'vehiculo-001',
        disponible: true,
        ciudadId: 'ciudad-001',
        latitud: 4.65,
        longitud: -74.05,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Simular que existe una ruta actual para el equipo
      rutaRepositoryMock.findByEquipoAndDate.mockResolvedValueOnce(rutaMock);
      
      await rutasController.replanificarRuta(mockRequest as Request, mockResponse as Response);
      
      expect(optimizacionServiceMock.validarReplanificacion).toHaveBeenCalledWith('equipo-001', 'evento-123');
      // Ya no esperamos una llamada directa a replanificarRuta porque se hace a través de PubSub
      expect(pubSubServiceMock.publicar).toHaveBeenCalledWith(
        'route-replanifications',
        expect.objectContaining({
          equipoId: 'equipo-001',
          eventoId: 'evento-123',
          requestId: expect.any(String)
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(true, 'Ruta replanificada exitosamente', expect.objectContaining({
        id: 'ruta-001',
        equipoId: 'equipo-001'
      })));
    }, 60000); // Incrementar timeout a 60s
    
    it('debería devolver error si no hay ruta actual para replanificar', async () => {
      mockRequest.params = { equipoId: 'equipo-sin-ruta' };
      mockRequest.body = { eventoId: 'evento-123' };
      
      // Mock del método waitForResult
      (rutasController as any).waitForResult = jest.fn().mockResolvedValueOnce(null);
      
      // Simular que el equipo existe
      equipoRepositoryMock.findById.mockResolvedValueOnce({
        id: 'equipo-sin-ruta', 
        nombre: 'Equipo Sin Ruta',
        transportistas: [],
        vehiculoId: 'vehiculo-002',
        disponible: true,
        ciudadId: 'ciudad-001',
        latitud: 4.68,
        longitud: -74.08,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Simular que no hay ruta para replanificar
      rutaRepositoryMock.findByEquipoAndDate.mockResolvedValueOnce(null);
      
      await rutasController.replanificarRuta(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(false, 'No hay ruta activa para replanificar', null));
    }, 60000); // Incrementar timeout a 60s
    
    it('debería manejar errores de validación de replanificación', async () => {
      mockRequest.params = { equipoId: 'equipo-001' };
      // No incluimos eventoId en el body para provocar el error de validación
      
      await rutasController.replanificarRuta(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(false, 'Se requiere equipoId y eventoId', null));
    });
  });
  
  describe('obtenerRutaActual', () => {
    it('debería obtener la ruta actual para un equipo', async () => {
      mockRequest.params = { equipoId: 'equipo-001' };
      
      await rutasController.obtenerRutaActual(mockRequest as Request, mockResponse as Response);
      
      expect(rutaRepositoryMock.findByEquipoAndDate).toHaveBeenCalledWith('equipo-001', expect.any(Date));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(true, 'Ruta obtenida correctamente', rutaMock));
    });
    
    it('debería devolver 404 si no hay ruta para el equipo', async () => {
      mockRequest.params = { equipoId: 'equipo-sin-ruta' };
      rutaRepositoryMock.findByEquipoAndDate.mockResolvedValueOnce(null);
      
      await rutasController.obtenerRutaActual(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(new ApiResponse(false, 'No se encontró una ruta para el equipo en la fecha actual', null));
    });
  });
}); 
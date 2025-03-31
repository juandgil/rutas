import 'reflect-metadata';
import { Request, Response } from 'express';
import { EventosController } from '../../interfaces/controllers/eventos.controller';
import { IEventoService } from '../../application/interfaces/evento-service.interface';
import { Evento, TipoEvento } from '../../domain/entities/evento.entity';
import { NivelImpacto } from '../../domain/interfaces/external-apis.interface';
import { CrearEventoDto, EventoResponseDto } from '../../application/dtos/evento.dto';
import { ApiResponse } from '../../interfaces/dtos/common.dto';

// Mocks
jest.mock('../../application/interfaces/evento-service.interface');

describe('EventosController', () => {
  let eventosController: EventosController;
  let eventoServiceMock: jest.Mocked<IEventoService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  // Datos de prueba
  const fechaActual = new Date();
  
  const eventosMock: Evento[] = [
    {
      id: 'evento-123',
      tipo: TipoEvento.TRAFICO,
      descripcion: 'Cierre vial por manifestación',
      latitud: 4.6782,
      longitud: -74.0582,
      ciudadId: 'ciudad-001',
      equipoId: 'equipo-001',
      impacto: NivelImpacto.ALTO,
      activo: true,
      metadatos: { tiempoEstimadoResolucion: '2 horas' },
      createdAt: fechaActual,
      updatedAt: fechaActual,
      fecha: fechaActual
    },
    {
      id: 'evento-456',
      tipo: TipoEvento.CLIMA,
      descripcion: 'Lluvia intensa en zona norte',
      latitud: 4.7123,
      longitud: -74.0321,
      ciudadId: 'ciudad-001',
      equipoId: 'equipo-002',
      impacto: NivelImpacto.MEDIO,
      activo: true,
      metadatos: { intensidad: 'fuerte' },
      createdAt: fechaActual,
      updatedAt: fechaActual,
      fecha: fechaActual
    }
  ];
  
  const nuevoEventoMock: CrearEventoDto = {
    tipo: TipoEvento.TRAFICO,
    descripcion: 'Accidente en la autopista',
    latitud: 4.6543,
    longitud: -74.0876,
    ciudadId: 'ciudad-001',
    equipoId: 'equipo-003',
    impacto: NivelImpacto.ALTO
  };
  
  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Configurar mocks
    eventoServiceMock = {
      obtenerEventosActivos: jest.fn().mockResolvedValue(eventosMock),
      obtenerEventosPorCiudad: jest.fn().mockResolvedValue(eventosMock),
      obtenerEventosPorEquipo: jest.fn().mockImplementation((equipoId) => {
        if (equipoId === 'equipo-001') {
          return Promise.resolve([eventosMock[0]]);
        }
        return Promise.resolve([]);
      }),
      registrarEvento: jest.fn().mockImplementation((evento) => {
        return Promise.resolve({
          id: 'evento-nuevo',
          ...evento,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          fecha: new Date()
        });
      }),
      obtenerEvento: jest.fn().mockImplementation((id) => {
        const evento = eventosMock.find(e => e.id === id);
        return Promise.resolve(evento || null);
      }),
      marcarInactivo: jest.fn().mockImplementation((id) => {
        const evento = eventosMock.find(e => e.id === id);
        if (!evento) return Promise.reject(new Error('Evento no encontrado'));
        
        return Promise.resolve({
          ...evento,
          activo: false
        });
      })
    } as any;
    
    // Inicializar controlador con mocks
    eventosController = new EventosController(eventoServiceMock);
    
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
  
  describe('obtenerEventosActivos', () => {
    it('debería obtener todos los eventos activos', async () => {
      // Mock de eventService
      const eventosMockCompletos = eventosMock.map(e => ({
        ...e,
        createdAt: fechaActual,
        updatedAt: fechaActual
      }));
      eventoServiceMock.obtenerEventosActivos.mockResolvedValue(eventosMockCompletos);
      
      await eventosController.obtenerEventosActivos(mockRequest as Request, mockResponse as Response);
      
      expect(eventoServiceMock.obtenerEventosActivos).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('debería manejar errores al obtener eventos', async () => {
      eventoServiceMock.obtenerEventosActivos.mockRejectedValue(new Error('Error en BD'));
      
      await eventosController.obtenerEventosActivos(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });
    });
  });
  
  describe('obtenerEventosPorCiudad', () => {
    it('debería obtener eventos por ciudad', async () => {
      mockRequest.params = { ciudadId: 'ciudad-001' };
      const eventosMockCompletos = eventosMock.map(e => ({
        ...e,
        createdAt: fechaActual,
        updatedAt: fechaActual
      }));
      eventoServiceMock.obtenerEventosPorCiudad.mockResolvedValue(eventosMockCompletos);
      
      await eventosController.obtenerEventosPorCiudad(mockRequest as Request, mockResponse as Response);
      
      expect(eventoServiceMock.obtenerEventosPorCiudad).toHaveBeenCalledWith('ciudad-001');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('debería manejar errores al obtener eventos por ciudad', async () => {
      mockRequest.params = { ciudadId: 'ciudad-invalida' };
      eventoServiceMock.obtenerEventosPorCiudad.mockRejectedValue(new Error('Ciudad no encontrada'));
      
      await eventosController.obtenerEventosPorCiudad(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });
    });
  });
  
  describe('registrarEvento', () => {
    it('debería registrar un nuevo evento', async () => {
      mockRequest.body = nuevoEventoMock;
      
      await eventosController.registrarEvento(mockRequest as Request, mockResponse as Response);
      
      expect(eventoServiceMock.registrarEvento).toHaveBeenCalledWith(nuevoEventoMock);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 'evento-nuevo',
        tipo: nuevoEventoMock.tipo,
        descripcion: nuevoEventoMock.descripcion
      }));
    });
    
    it('debería validar los datos del evento', async () => {
      mockRequest.body = {
        descripcion: 'Evento incompleto',
        equipoId: 'equipo-001'
      };
      
      await eventosController.registrarEvento(mockRequest as Request, mockResponse as Response);
      
      expect(eventoServiceMock.registrarEvento).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Datos de entrada inválidos'
      }));
    });
    
    it('debería manejar errores al registrar evento', async () => {
      mockRequest.body = nuevoEventoMock;
      eventoServiceMock.registrarEvento.mockRejectedValueOnce(new Error('Error al registrar'));
      
      await eventosController.registrarEvento(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Error interno del servidor'
      }));
    });
  });
  
  describe('obtenerEventosPorEquipo', () => {
    it('debería obtener eventos por equipo', async () => {
      mockRequest.params = { equipoId: 'equipo-001' };
      const eventosMockCompletos = [{ 
        ...eventosMock[0],
        createdAt: fechaActual,
        updatedAt: fechaActual
      }];
      eventoServiceMock.obtenerEventosPorEquipo.mockResolvedValue(eventosMockCompletos);
      
      await eventosController.obtenerEventosPorEquipo(mockRequest as Request, mockResponse as Response);
      
      expect(eventoServiceMock.obtenerEventosPorEquipo).toHaveBeenCalledWith('equipo-001');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('debería devolver array vacío si no hay eventos para el equipo', async () => {
      mockRequest.params = { equipoId: 'equipo-sin-eventos' };
      
      await eventosController.obtenerEventosPorEquipo(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });
  
  describe('marcarInactivo', () => {
    it('debería marcar un evento como inactivo', async () => {
      mockRequest.params = { id: 'evento-123' };
      eventoServiceMock.marcarInactivo.mockResolvedValue({ ...eventosMock[0], activo: false });
      
      await eventosController.marcarInactivo(mockRequest as Request, mockResponse as Response);
      
      expect(eventoServiceMock.marcarInactivo).toHaveBeenCalledWith('evento-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 'evento-123',
        activo: false
      }));
    });
    
    it('debería manejar eventos inexistentes', async () => {
      mockRequest.params = { id: 'evento-inexistente' };
      eventoServiceMock.marcarInactivo.mockRejectedValue(new Error('No se encontró el evento'));
      
      await eventosController.marcarInactivo(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Evento no encontrado'
      });
    });
  });
}); 
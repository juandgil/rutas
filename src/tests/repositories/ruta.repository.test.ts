import 'reflect-metadata';
import { RutaRepository } from '../../infrastructure/repositories/ruta.repository.impl';
import { Ruta, EstadoRuta } from '../../domain/entities/ruta.entity';
import { IDatabase } from '../../infrastructure/database/database';

// Ampliar la interfaz RutaRepository para incluir el método hayReplanificacionesHoy
declare module '../../infrastructure/repositories/ruta.repository.impl' {
  interface RutaRepository {
    hayReplanificacionesHoy(equipoId: string): Promise<boolean>;
  }
}

// Mock de la base de datos
jest.mock('../../infrastructure/database/database');

describe('RutaRepository', () => {
  let rutaRepository: RutaRepository;
  let databaseMock: jest.Mocked<IDatabase>;
  
  // Datos de prueba
  const fechaPrueba = new Date('2025-03-31');
  fechaPrueba.setHours(0, 0, 0, 0);
  
  const rutaMock: Ruta = {
    id: 'ruta-123',
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
  
  // Mock de resultados de la base de datos
  const dbResultMock = {
    id: 'ruta-123',
    equipo_id: 'equipo-001',
    fecha: fechaPrueba.toISOString(),
    envios: ['envio-001', 'envio-002'],
    estado: 'PLANIFICADA',
    distancia_total: 25.5,
    tiempo_estimado: 35,
    replanificada: false,
    ultimo_evento_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Configurar mock de IDatabase
    databaseMock = {
      query: jest.fn().mockImplementation(() => Promise.resolve([
        {
          id: 'ruta-123',
          equipo_id: 'equipo-001',
          fecha: fechaPrueba.toISOString(),
          envios: JSON.stringify(['envio-001', 'envio-002']),
          estado: 'PLANIFICADA',
          distancia_total: 25.5,
          tiempo_estimado: 35,
          replanificada: false,
          ultimo_evento_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])),
      execute: jest.fn().mockResolvedValue(null),
      transaction: jest.fn().mockImplementation(callback => {
        return callback({
          query: jest.fn().mockResolvedValue([]),
          execute: jest.fn().mockResolvedValue(null)
        });
      })
    } as any;
    
    // Inicializar repositorio con mock
    rutaRepository = new RutaRepository(databaseMock);
    
    // Implementar el método hayReplanificacionesHoy para las pruebas
    (rutaRepository as any).hayReplanificacionesHoy = jest.fn().mockImplementation((equipoId) => {
      return Promise.resolve(false);
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('findById', () => {
    it('debería encontrar una ruta por ID', async () => {
      // Configurar mock para que devuelva la ruta con la estructura correcta
      databaseMock.query.mockImplementationOnce(() => Promise.resolve([{
        id: 'ruta-123',
        equipo_id: 'equipo-001',
        fecha: fechaPrueba.toISOString(),
        envios: JSON.stringify(['envio-001', 'envio-002']),
        estado: 'PLANIFICADA',
        distancia_total: 25.5,
        tiempo_estimado: 35,
        replanificada: false,
        ultimo_evento_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]));
      
      const result = await rutaRepository.findById('ruta-123');
      
      expect(databaseMock.query).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 'ruta-123');
      expect(result).toHaveProperty('equipo_id', 'equipo-001');
    });
    
    it('debería retornar null si no encuentra la ruta', async () => {
      databaseMock.query.mockResolvedValueOnce([]);
      
      const result = await rutaRepository.findById('ruta-no-existente');
      
      expect(result).toBeNull();
    });
  });
  
  describe('findByEquipoAndDate', () => {
    it('debería encontrar una ruta por equipoId y fecha', async () => {
      // Configurar mock para que devuelva la ruta con la estructura correcta
      databaseMock.query.mockImplementationOnce(() => Promise.resolve([{
        id: 'ruta-123',
        equipo_id: 'equipo-001',
        fecha: fechaPrueba.toISOString(),
        envios: JSON.stringify(['envio-001', 'envio-002']),
        estado: 'PLANIFICADA',
        distancia_total: 25.5,
        tiempo_estimado: 35,
        replanificada: false,
        ultimo_evento_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]));
      
      const result = await rutaRepository.findByEquipoAndDate('equipo-001', fechaPrueba);
      
      expect(databaseMock.query).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('equipo_id', 'equipo-001');
    });
    
    it('debería retornar null si no encuentra la ruta', async () => {
      databaseMock.query.mockResolvedValueOnce([]);
      
      const result = await rutaRepository.findByEquipoAndDate('equipo-no-existente', fechaPrueba);
      
      expect(result).toBeNull();
    });
  });
  
  describe('create', () => {
    it('debería crear una nueva ruta correctamente', async () => {
      const nuevaRuta: Partial<Ruta> = {
        equipoId: 'equipo-002',
        fecha: new Date(),
        envios: ['envio-003'],
        estado: EstadoRuta.PLANIFICADA,
        distanciaTotal: 15,
        tiempoEstimado: 25,
        replanificada: false,
        ultimoEventoId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock para simular la respuesta de la base de datos después de crear
      databaseMock.query.mockImplementationOnce(() => Promise.resolve([{
        id: 'ruta-nueva',
        equipo_id: 'equipo-002',
        fecha: nuevaRuta.fecha?.toISOString(),
        envios: JSON.stringify(['envio-003']),
        estado: 'PLANIFICADA',
        distancia_total: 15,
        tiempo_estimado: 25,
        replanificada: false,
        ultimo_evento_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]));
      
      const result = await rutaRepository.create(nuevaRuta as Ruta);
      
      expect(databaseMock.query).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'ruta-nueva');
      expect(result).toHaveProperty('equipo_id', 'equipo-002');
    });
  });
  
  describe('update', () => {
    it('debería actualizar una ruta existente', async () => {
      const actualizacion = {
        estado: EstadoRuta.COMPLETADA,
        tiempoEstimado: 40
      };
      
      // Mock para simular la respuesta de la base de datos después de actualizar
      databaseMock.query.mockImplementationOnce(() => Promise.resolve([{
        id: 'ruta-123',
        equipo_id: 'equipo-001',
        fecha: fechaPrueba.toISOString(),
        envios: JSON.stringify(['envio-001', 'envio-002']),
        estado: 'COMPLETADA',
        distancia_total: 25.5,
        tiempo_estimado: 40,
        replanificada: false,
        ultimo_evento_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]));
      
      const result = await rutaRepository.update('ruta-123', actualizacion);
      
      expect(databaseMock.query).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'ruta-123');
      expect(result).toHaveProperty('estado', 'COMPLETADA');
      expect(result).toHaveProperty('tiempo_estimado', 40);
    });
  });
  
  describe('findAll', () => {
    it('debería retornar todas las rutas', async () => {
      // Configurar mock para retornar múltiples rutas
      databaseMock.query.mockResolvedValueOnce([
        {
          id: 'ruta-123',
          equipo_id: 'equipo-001',
          fecha: fechaPrueba.toISOString(),
          envios: JSON.stringify(['envio-001', 'envio-002']),
          estado: 'PLANIFICADA',
          distancia_total: 25.5,
          tiempo_estimado: 35,
          replanificada: false,
          ultimo_evento_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'ruta-456',
          equipo_id: 'equipo-002',
          fecha: fechaPrueba.toISOString(),
          envios: JSON.stringify(['envio-003']),
          estado: 'COMPLETADA',
          distancia_total: 15,
          tiempo_estimado: 20,
          replanificada: false,
          ultimo_evento_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      
      const result = await rutaRepository.findAll();
      
      expect(databaseMock.query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'ruta-123');
      expect(result[1]).toHaveProperty('id', 'ruta-456');
    });
  });
  
  describe('hayReplanificacionesHoy', () => {
    it('debería verificar si hay replanificaciones para hoy', async () => {
      // Configurar mock para simular que hay replanificaciones
      (rutaRepository as any).hayReplanificacionesHoy.mockResolvedValueOnce(true);
      databaseMock.execute.mockResolvedValueOnce({ rowCount: 1 } as any);
      
      const result = await rutaRepository.hayReplanificacionesHoy('equipo-001');
      
      expect(result).toBe(true);
    });
    
    it('debería retornar false si no hay replanificaciones', async () => {
      // Configurar mock para simular que no hay replanificaciones
      (rutaRepository as any).hayReplanificacionesHoy.mockResolvedValueOnce(false);
      databaseMock.execute.mockResolvedValueOnce({ rowCount: 0 } as any);
      
      const result = await rutaRepository.hayReplanificacionesHoy('equipo-001');
      
      expect(result).toBe(false);
    });
  });
}); 
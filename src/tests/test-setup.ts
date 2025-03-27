import 'reflect-metadata';
import * as dotenv from 'dotenv';

// Cargar variables de entorno antes de cualquier otra configuración
dotenv.config();

// Forzar el puerto correcto para la base de datos
process.env.DB_PORT = '5433';

import { Container } from 'inversify';
import { TYPES } from '../infrastructure/ioc/types';

// Mocks más específicos para la base de datos
jest.mock('../infrastructure/database/database', () => {
  return {
    Database: jest.fn().mockImplementation(() => ({
      query: jest.fn().mockImplementation((query, params) => {
        console.log('Mock DB Query:', query, params);
        // Simulación de respuestas específicas según la consulta
        if (query.includes('SELECT * FROM eventos WHERE activo = true')) {
          return Promise.resolve([]);
        }
        if (query.includes('SELECT * FROM eventos WHERE ciudad_id')) {
          return Promise.resolve([]);
        }
        if (query.includes('INSERT INTO eventos')) {
          return Promise.resolve([{ id: 'evento-123' }]);
        }
        if (query.includes('SELECT * FROM eventos WHERE equipo_id')) {
          return Promise.resolve([
            {
              id: 'evento-123',
              tipo: 'TRAFICO',
              descripcion: 'Cierre vial',
              latitud: 4.6782,
              longitud: -74.0582,
              ciudad_id: 'ciudad-001',
              equipo_id: params ? params[0] : 'equipo-default',
              impacto: 'ALTO',
              activo: true
            }
          ]);
        }
        if (query.includes('UPDATE eventos SET activo = false')) {
          return Promise.resolve([{ id: params ? params[0] : 'evento-default', activo: false }]);
        }
        return Promise.resolve([]);
      }),
      
      one: jest.fn().mockImplementation((query, params) => {
        console.log('Mock DB One:', query, params);
        if (query.includes('SELECT * FROM usuarios')) {
          // Simular autenticación
          if (params && params[0] === 'operador') {
            return Promise.resolve({ 
              id: 'user-1', 
              username: 'operador', 
              password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Hash simulado
              role: 'OPERADOR' 
            });
          } else if (params && params[0] === 'transportista') {
            return Promise.resolve({ 
              id: 'user-2', 
              username: 'transportista', 
              password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Hash simulado
              role: 'TRANSPORTISTA' 
            });
          }
        }
        return Promise.resolve({});
      }),
      
      none: jest.fn().mockResolvedValue(null)
    }))
  };
});

// Mock para JWT específicamente
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation((payload, secret, options) => {
    // Crear un token falso pero con estructura válida
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
      JSON.stringify(payload)
    ).toString('base64')}.SIGNATURE`;
  }),
  verify: jest.fn().mockImplementation((token, secret) => {
    // Extraer payload del token
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    
    try {
      return JSON.parse(Buffer.from(parts[1], 'base64').toString());
    } catch (e) {
      throw new Error('Invalid token');
    }
  })
}));

// Mock para el servicio de autenticación
jest.mock('../application/services/auth.service', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      login: jest.fn().mockImplementation((username, password) => {
        if (username === 'operador' && password === 'admin123') {
          return Promise.resolve({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiT1BFUkFET1IiLCJpYXQiOjE2MTIxNDU2NDF9.SIGNATURE',
            usuario: { id: 'user-1', username: 'operador', role: 'OPERADOR' }
          });
        }
        if (username === 'transportista' && password === 'admin123') {
          return Promise.resolve({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTIiLCJyb2xlIjoiVFJBTlNQT1JUSVNUQSIsImlhdCI6MTYxMjE0NTY0MX0.SIGNATURE',
            usuario: { id: 'user-2', username: 'transportista', role: 'TRANSPORTISTA' }
          });
        }
        return Promise.reject(new Error('Credenciales inválidas'));
      }),
      validateToken: jest.fn().mockImplementation((token) => {
        if (token.includes('OPERADOR')) {
          return Promise.resolve({ sub: 'user-1', role: 'OPERADOR' });
        }
        if (token.includes('TRANSPORTISTA')) {
          return Promise.resolve({ sub: 'user-2', role: 'TRANSPORTISTA' });
        }
        return Promise.reject(new Error('Token inválido'));
      })
    }))
  };
});

// Mock para cache
jest.mock('../infrastructure/cache/redis-client', () => {
  return {
    RedisClient: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(true)
    }))
  };
});

// Mock para el servicio de eventos
jest.mock('../application/services/evento.service', () => {
  return {
    EventoService: jest.fn().mockImplementation(() => ({
      obtenerEventosActivos: jest.fn().mockReturnValue([]),
      obtenerEventosPorCiudad: jest.fn().mockReturnValue([]),
      registrarEvento: jest.fn().mockImplementation((evento) => {
        return {
          id: 'evento-123',
          ...evento,
          activo: true,
          fechaCreacion: new Date()
        };
      }),
      obtenerEventosPorEquipo: jest.fn().mockImplementation((equipoId) => {
        return [
          {
            id: 'evento-123',
            tipo: 'TRAFICO',
            descripcion: 'Cierre vial',
            latitud: 4.6782,
            longitud: -74.0582,
            ciudadId: 'ciudad-001',
            equipoId: equipoId,
            impacto: 'ALTO',
            activo: true
          }
        ];
      }),
      marcarInactivo: jest.fn().mockImplementation((id) => {
        return {
          id,
          activo: false
        };
      })
    }))
  };
});

// Mock para el servicio de optimización de rutas
jest.mock('../application/services/optimizacion.service', () => {
  return {
    OptimizacionService: jest.fn().mockImplementation(() => ({
      optimizarRuta: jest.fn().mockImplementation((equipoId) => {
        return {
          id: 'ruta-123',
          equipoId,
          fecha: new Date(),
          envios: ['envio-1', 'envio-2'],  // Array de IDs de envíos
          estado: 'OPTIMIZADA',
          distanciaTotal: 25,
          tiempoEstimado: 35,
          replanificada: false,
          ultimoEventoId: null,
          tramos: [
            { origen: 'A', destino: 'B', distancia: 10, tiempo: 15 },
            { origen: 'B', destino: 'C', distancia: 15, tiempo: 20 }
          ],
          tiempoEstimadoTotal: 35
        };
      }),
      validarReplanificacion: jest.fn().mockResolvedValue(true),
      replanificarRuta: jest.fn().mockImplementation((equipoId, eventoId) => {
        return {
          id: 'ruta-123',
          equipoId,
          fecha: new Date(),
          envios: ['envio-1', 'envio-2'],  // Array de IDs de envíos
          estado: 'REPLANIFICADA',
          distanciaTotal: 30,
          tiempoEstimado: 45,
          replanificada: true,
          ultimoEventoId: eventoId,
          tramos: [
            { origen: 'A', destino: 'D', distancia: 12, tiempo: 18 },
            { origen: 'D', destino: 'C', distancia: 18, tiempo: 27 }
          ],
          tiempoEstimadoTotal: 45
        };
      })
    }))
  };
});

// Mock para el repositorio de envíos
jest.mock('../infrastructure/repositories/envio.repository.impl', () => {
  return {
    EnvioRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn().mockImplementation((id) => {
        return Promise.resolve({
          id,
          guia: `GUIA-${id}`,
          ordenEntrega: 1,
          direccionDestino: 'Calle Principal 123',
          latitudDestino: 4.6097,
          longitudDestino: -74.0817,
          slaId: 'sla-001',
          estado: 'ASIGNADO'
        });
      }),
      findAll: jest.fn().mockResolvedValue([])
    }))
  };
});

// Mock para el repositorio de SLAs
jest.mock('../infrastructure/repositories/sla.repository.impl', () => {
  return {
    SlaRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn().mockImplementation((id) => {
        return Promise.resolve({
          id,
          nombre: 'SLA Estándar',
          descripcion: 'Entrega estándar en 48 horas',
          tiempoEntrega: 48,
          prioridad: 2
        });
      }),
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'sla-001',
          nombre: 'SLA Prioritario',
          descripcion: 'Entrega prioritaria en 24 horas',
          tiempoEntrega: 24,
          prioridad: 1
        },
        {
          id: 'sla-002',
          nombre: 'SLA Estándar',
          descripcion: 'Entrega estándar en 48 horas',
          tiempoEntrega: 48,
          prioridad: 2
        }
      ])
    }))
  };
});

// Configurar el contenedor de IoC para las pruebas
const configureContainer = () => {
  const container = new Container();
  // Configurar el contenedor con los mocks
  // ...
  return container;
};

export { configureContainer }; 
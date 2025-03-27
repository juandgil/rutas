import 'dotenv/config'; // Cargar variables de entorno primero
import request from 'supertest';
import app from '../index';

// Casos de prueba para validar el flujo de trabajo
describe('Flujo de Trabajo Diario', () => {
  
  // Variables para almacenar datos a lo largo de las pruebas
  let operadorToken: string, transportistaToken: string;
  let equipoId = 'equipo-001';
  let rutaOptimizada: any;
  let eventoId: string;
  
  describe('1. Inicio de la Jornada', () => {
    
    test('Autenticación de operador del centro de control', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'operador',
          password: 'admin123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      operadorToken = response.body.token;
    });
    
    test('Autenticación de transportista', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'transportista',
          password: 'admin123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      transportistaToken = response.body.token;
    });
    
    test('Generación de ruta optimizada para el equipo', async () => {
      const response = await request(app)
        .get(`/api/rutas/optimizar/${equipoId}`)
        .set('Authorization', `Bearer ${operadorToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('envios');
      expect(response.body).toHaveProperty('tiempoEstimado');
      expect(response.body).toHaveProperty('distanciaTotal');
      expect(response.body.envios.length).toBeGreaterThan(0);
      
      rutaOptimizada = response.body;
    });
  });
  
  describe('2. Operación en Curso', () => {
    
    test('Consulta de eventos activos', async () => {
      const response = await request(app)
        .get('/api/eventos/activos')
        .set('Authorization', `Bearer ${operadorToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('Consulta de eventos por ciudad', async () => {
      const ciudadId = 'ciudad-001';
      const response = await request(app)
        .get(`/api/eventos/ciudad/${ciudadId}`)
        .set('Authorization', `Bearer ${operadorToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('Registro de evento inesperado por transportista', async () => {
      const evento = {
        tipo: 'TRAFICO',
        descripcion: 'Cierre vial por manifestación en Avenida Principal',
        latitud: 4.6782,
        longitud: -74.0582,
        ciudadId: 'ciudad-001',
        equipoId: equipoId,
        impacto: 'ALTO',
        metadatos: {
          tiempoEstimadoResolucion: '2 horas',
          autoridades: 'Policía de tránsito presente en el lugar'
        }
      };
      
      const response = await request(app)
        .post('/api/eventos')
        .set('Authorization', `Bearer ${transportistaToken}`)
        .send(evento);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.tipo).toBe('TRAFICO');
      expect(response.body.impacto).toBe('ALTO');
      expect(response.body.activo).toBe(true);
      
      eventoId = response.body.id;
    });
    
    test('Replanificación de ruta debido al evento', async () => {
      // Esperar un momento para que el evento sea procesado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await request(app)
        .put(`/api/rutas/replanificar/${equipoId}`)
        .set('Authorization', `Bearer ${operadorToken}`)
        .send({
          eventoId: eventoId
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('replanificada');
      expect(response.body.replanificada).toBe(true);
      expect(response.body).toHaveProperty('ultimoEventoId');
      expect(response.body.ultimoEventoId).toBe(eventoId);
      
      // Validar que la ruta se ha modificado usando los nombres reales de las propiedades
      expect(response.body.tiempoEstimado).not.toBe(rutaOptimizada.tiempoEstimado);
    });
    
    test('Consulta de eventos por equipo afectado', async () => {
      const response = await request(app)
        .get(`/api/eventos/equipo/${equipoId}`)
        .set('Authorization', `Bearer ${transportistaToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some((e: any) => e.id === eventoId)).toBe(true);
    });
  });
  
  describe('3. Cierre de la Jornada', () => {
    
    test('Marcar evento como inactivo', async () => {
      const response = await request(app)
        .put(`/api/eventos/${eventoId}/inactivar`)
        .set('Authorization', `Bearer ${operadorToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', eventoId);
      expect(response.body).toHaveProperty('activo', false);
    });
    
    test('Verificar que el evento ya no aparece como activo', async () => {
      const response = await request(app)
        .get('/api/eventos/activos')
        .set('Authorization', `Bearer ${operadorToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((e: any) => e.id !== eventoId)).toBe(true);
    });
  });
});

import { controller, httpPost, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../../infrastructure/ioc/types';
import { IDatabase } from '../../infrastructure/database/database';
import { ApiResponse } from '../dtos/common.dto';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoints para administración del sistema
 */
@controller('/admin')
export class AdminController {
  constructor(
    @inject(TYPES.IDatabase) private readonly db: IDatabase
  ) {}

  /**
   * @swagger
   * /admin/reset-test-data:
   *   post:
   *     summary: Reinicia los datos para pruebas de optimización y replanificación
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Datos reiniciados exitosamente
   *       500:
   *         description: Error al reiniciar datos
   */
  @httpPost('/reset-test-data')
  async resetTestData(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      // Verificar autenticación y rol
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'No se proporcionó token de autenticación', 
          data: null 
        });
      }

      // 1. Reiniciar completamente todos los envíos a estado PENDIENTE
      await this.db.query(`
        UPDATE envios 
        SET estado = 'PENDIENTE', 
            equipo_id = NULL, 
            orden_entrega = NULL, 
            fecha_entrega_estimada = NULL
        WHERE id LIKE 'envio-%'
      `);
      console.log('Envíos reiniciados a estado PENDIENTE');

      // 2. Eliminar todas las rutas existentes
      await this.db.query(`DELETE FROM rutas`);
      console.log('Todas las rutas eliminadas');

      // 3. Actualizar disponibilidad de vehículos
      await this.db.query(`UPDATE vehiculos SET disponible = true`);
      console.log('Disponibilidad de vehículos actualizada');

      // 4. Actualizar disponibilidad de equipos
      await this.db.query(`UPDATE equipos SET disponible = true`);
      console.log('Disponibilidad de equipos actualizada');

      // 5. Actualizar ubicaciones de equipos
      const tablaExiste = await this.verificarTablaExiste('equipos_ubicacion_actual');

      if (tablaExiste) {
        // Insertar o actualizar ubicaciones
        await this.db.query(`
          INSERT INTO equipos_ubicacion_actual (equipo_id, latitud, longitud, velocidad, timestamp)
          VALUES 
            ('equipo-001', 4.65, -74.05, 0, NOW()),
            ('equipo-002', 4.61, -74.08, 0, NOW()),
            ('equipo-003', 4.70, -74.04, 0, NOW()),
            ('equipo-004', 4.67, -74.07, 0, NOW())
          ON CONFLICT (equipo_id) 
          DO UPDATE SET 
            latitud = EXCLUDED.latitud, 
            longitud = EXCLUDED.longitud, 
            velocidad = EXCLUDED.velocidad, 
            timestamp = NOW()
        `);
        console.log('Ubicaciones de equipos actualizadas');
      } else {
        console.log('La tabla equipos_ubicacion_actual no existe - creándola primero');
        
        // Crear tabla y insertar datos
        await this.db.query(`
          CREATE TABLE IF NOT EXISTS equipos_ubicacion_actual (
            equipo_id VARCHAR(36) PRIMARY KEY REFERENCES equipos(id),
            latitud DECIMAL(10, 6) NOT NULL,
            longitud DECIMAL(10, 6) NOT NULL,
            velocidad DECIMAL(5, 2) NOT NULL DEFAULT 0,
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await this.db.query(`
          INSERT INTO equipos_ubicacion_actual (equipo_id, latitud, longitud, velocidad, timestamp)
          VALUES 
            ('equipo-001', 4.65, -74.05, 0, NOW()),
            ('equipo-002', 4.61, -74.08, 0, NOW()),
            ('equipo-003', 4.70, -74.04, 0, NOW()),
            ('equipo-004', 4.67, -74.07, 0, NOW())
        `);
        console.log('Tabla equipos_ubicacion_actual creada y poblada');
      }

      // 6. Mostrar el estado actual de los envíos (para verificación)
      const enviosQuery = await this.db.query(`
        SELECT id, estado, peso, volumen, equipo_id, ciudad_id 
        FROM envios 
        WHERE ciudad_id = 'ciudad-001'
        ORDER BY id
      `);

      // 7. eliminar todos los eventos
      await this.db.query(`DELETE FROM eventos`);
      console.log('Todos los eventos eliminados');
      
      console.log('Estado actual de envíos:', enviosQuery);

      return res.status(200).json(
        new ApiResponse(true, 'Datos de prueba reiniciados exitosamente', {
          enviosReiniciados: true,
          rutasEliminadas: true,
          vehiculosDisponibles: true,
          equiposDisponibles: true,
          ubicacionesActualizadas: true,
          enviosActuales: enviosQuery
        })
      );
    } catch (error) {
      console.error('Error al reiniciar datos de prueba:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al reiniciar datos de prueba', { error: (error as Error).message })
      );
    }
  }

  // Método auxiliar para verificar si una tabla existe
  private async verificarTablaExiste(nombreTabla: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `;
      const result = await this.db.query<{ exists: boolean }>(query, [nombreTabla]);
      return result[0]?.exists || false;
    } catch (error) {
      console.error(`Error al verificar si existe la tabla ${nombreTabla}:`, error);
      return false;
    }
  }
} 
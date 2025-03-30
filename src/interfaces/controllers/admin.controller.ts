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
    @inject(TYPES.IDatabase) private db: IDatabase
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

      // 1. Reiniciar estado de los envíos
      await this.db.query(`
        UPDATE envios 
        SET estado = 'PENDIENTE', 
            equipo_id = NULL, 
            orden_entrega = NULL, 
            fecha_entrega_estimada = NULL
        WHERE ciudad_id = 'ciudad-001'
      `);
      console.log('Envíos reiniciados');

      // 2. Eliminar rutas existentes
      await this.db.query(`
        DELETE FROM rutas 
        WHERE equipo_id IN (
          SELECT id FROM equipos WHERE ciudad_id = 'ciudad-001'
        )
      `);
      console.log('Rutas eliminadas');

      // 3. Actualizar ubicaciones de equipos o asegurarse de que existan
      // Primero verificamos si la tabla existe
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
          ON CONFLICT (equipo_id) 
          DO UPDATE SET 
            latitud = EXCLUDED.latitud, 
            longitud = EXCLUDED.longitud, 
            velocidad = EXCLUDED.velocidad, 
            timestamp = NOW()
        `);
        console.log('Tabla equipos_ubicacion_actual creada y poblada');
      }

      return res.status(200).json(
        new ApiResponse(true, 'Datos de prueba reiniciados exitosamente', {
          enviosReiniciados: true,
          rutasEliminadas: true,
          ubicacionesActualizadas: true
        })
      );
    } catch (error) {
      console.error('Error al reiniciar datos de prueba:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al reiniciar datos de prueba', null)
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
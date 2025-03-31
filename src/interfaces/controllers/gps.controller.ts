import { controller, httpGet, httpPost, request, response, requestParam } from 'inversify-express-utils';
import { inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../../infrastructure/ioc/types';
import { ApiResponse } from '../dtos/common.dto';
import { GpsUbicacion } from '../../domain/interfaces/external-apis.interface';
import { IGpsRepository } from '../../domain/repositories/gps.repository';
import { IEquipoRepository } from '../../domain/repositories/equipo.repository';
import { Gps } from '../../domain/entities/gps.entity';
import { v4 as uuidv4 } from 'uuid';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { IDatabase } from '../../infrastructure/database/database';

/**
 * @swagger
 * tags:
 *   name: GPS
 *   description: Endpoints para gestión y monitoreo de ubicaciones GPS de los equipos
 */
@controller('/gps')
export class GpsController {
  constructor(
    @inject(TYPES.IGpsRepository) private gpsRepository: IGpsRepository,
    @inject(TYPES.IEquipoRepository) private equipoRepository: IEquipoRepository,
    @inject(TYPES.IPubSubService) private pubSubService: IPubSubService,
    @inject(TYPES.IDatabase) private db: IDatabase
  ) {}

  /**
   * @swagger
   * /gps/sincronizar_ubicacion:
   *   post:
   *     summary: Sincroniza las ubicaciones actuales de todos los equipos desde los registros GPS
   *     description: Este endpoint debe ser llamado cada 5 minutos por Cloud Scheduler para mantener actualizada la tabla equipos_ubicacion_actual
   *     tags: [GPS]
   *     responses:
   *       200:
   *         description: Ubicaciones sincronizadas exitosamente
   *       500:
   *         description: Error del servidor
   */
  @httpPost('/sincronizar_ubicacion')
  async sincronizarUbicacion(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      console.log('[GpsController] Iniciando sincronización de ubicaciones GPS');
      
      // 1. Obtener todos los equipos activos
      const equipos = await this.equipoRepository.findAll();
      const equiposActivos = equipos.filter(e => e.disponible);
      
      if (equiposActivos.length === 0) {
        return res.status(200).json(
          new ApiResponse(true, 'No hay equipos activos para sincronizar', { equiposSincronizados: 0 })
        );
      }
      
      console.log(`[GpsController] Sincronizando ubicaciones para ${equiposActivos.length} equipos activos`);
      
      // 2. Para cada equipo, obtener una ubicación aleatoria de gps_registros
      const equiposSincronizados = [];
      
      for (const equipo of equiposActivos) {
        try {
          // Obtener ubicación aleatoria de la tabla gps_registros (que es de simulación)
          const queryGpsRegistros = `
            SELECT id, equipo_id, latitud, longitud, velocidad, timestamp
            FROM gps_registros 
            WHERE equipo_id = $1
            ORDER BY RANDOM()
            LIMIT 1
          `;
          
          const registrosGps = await this.db.query<Gps>(queryGpsRegistros, [equipo.id]);
          
          if (registrosGps.length === 0) {
            console.log(`[GpsController] No hay registros GPS para el equipo ${equipo.id}`);
            continue;
          }
          
          const ubicacionAleatoria = registrosGps[0];
          
          // 3. Actualizar o insertar en la tabla equipos_ubicacion_actual
          const upsertQuery = `
            INSERT INTO equipos_ubicacion_actual (
              equipo_id, latitud, longitud, velocidad, timestamp, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, NOW()
            )
            ON CONFLICT (equipo_id) 
            DO UPDATE SET 
              latitud = $2,
              longitud = $3,
              velocidad = $4,
              timestamp = $5,
              updated_at = NOW()
          `;
          
          await this.db.execute(upsertQuery, [
            equipo.id,
            ubicacionAleatoria.latitud,
            ubicacionAleatoria.longitud,
            ubicacionAleatoria.velocidad,
            ubicacionAleatoria.timestamp
          ]);
          
          equiposSincronizados.push(equipo.id);
          console.log(`[GpsController] Ubicación sincronizada para equipo ${equipo.id}`);
        } catch (equipoError) {
          console.error(`[GpsController] Error al sincronizar ubicación para equipo ${equipo.id}:`, equipoError);
          // Continuar con el siguiente equipo
        }
      }
      
      // 4. Publicar evento de sincronización completada
      await this.pubSubService.publicar('gps-updates', {
        evento: 'sincronizacion-completada',
        timestamp: new Date(),
        equiposSincronizados
      });
      
      return res.status(200).json(
        new ApiResponse(true, 'Ubicaciones sincronizadas exitosamente', {
          equiposSincronizados: equiposSincronizados.length,
          equipos: equiposSincronizados
        })
      );
    } catch (error) {
      console.error('[GpsController] Error al sincronizar ubicaciones GPS:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al sincronizar ubicaciones GPS', null)
      );
    }
  }

  /**
   * Genera datos de prueba para la tabla gps_registros
   * NOTA: Solo para entorno de desarrollo
   */
  @httpPost('/generar_datos_prueba')
  async generarDatosPrueba(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      console.log('[GpsController] Iniciando generación de datos de prueba para GPS');
      
      // Definir equipos para los que se generarán datos
      const equiposId = ['equipo-001', 'equipo-002'];
      
      // Verificar que los equipos existen
      for (const equipoId of equiposId) {
        const equipo = await this.equipoRepository.findById(equipoId);
        if (!equipo) {
          return res.status(400).json(
            new ApiResponse(false, `Equipo ${equipoId} no encontrado`, null)
          );
        }
      }
      
      // Eliminar registros existentes (solo para pruebas)
      await this.db.execute('DELETE FROM gps_registros WHERE equipo_id = ANY($1)', [equiposId]);
      
      // Definir coordenadas base para cada equipo
      const coordenadasBase: Record<string, { latitud: number; longitud: number }> = {
        'equipo-001': { latitud: 4.65, longitud: -74.05 },
        'equipo-002': { latitud: 4.61, longitud: -74.08 }
      };
      
      // Número de registros a generar por equipo
      const registrosPorEquipo = 100;
      
      // Generar datos para cada equipo
      const registrosInsertados = [];
      for (const equipoId of equiposId) {
        const base = coordenadasBase[equipoId];
        
        for (let i = 0; i < registrosPorEquipo; i++) {
          // Generar ubicación ligeramente diferente (simular movimiento)
          const latitud = base.latitud + (Math.random() - 0.5) * 0.1;
          const longitud = base.longitud + (Math.random() - 0.5) * 0.1;
          const velocidad = Math.floor(Math.random() * 60); // Entre 0 y 60 km/h
          
          // Generar timestamp aleatorio (últimas 24 horas)
          const horasAtras = Math.random() * 24;
          const timestamp = new Date(Date.now() - horasAtras * 60 * 60 * 1000);
          
          // Insertar registro
          const insertQuery = `
            INSERT INTO gps_registros (
              id, equipo_id, latitud, longitud, velocidad, timestamp, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, NOW()
            )
          `;
          
          await this.db.execute(insertQuery, [
            uuidv4(),
            equipoId,
            latitud,
            longitud,
            velocidad,
            timestamp
          ]);
          
          registrosInsertados.push({
            equipoId,
            latitud,
            longitud,
            velocidad,
            timestamp
          });
        }
      }
      
      // Actualizar también equipos_ubicacion_actual con un registro aleatorio
      for (const equipoId of equiposId) {
        const registrosEquipo = registrosInsertados.filter(r => r.equipoId === equipoId);
        if (registrosEquipo.length > 0) {
          // Tomar un registro aleatorio
          const registroAleatorio = registrosEquipo[Math.floor(Math.random() * registrosEquipo.length)];
          
          // Actualizar equipos_ubicacion_actual
          const upsertQuery = `
            INSERT INTO equipos_ubicacion_actual (
              equipo_id, latitud, longitud, velocidad, timestamp, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, NOW()
            )
            ON CONFLICT (equipo_id) 
            DO UPDATE SET 
              latitud = $2,
              longitud = $3,
              velocidad = $4,
              timestamp = $5,
              updated_at = NOW()
          `;
          
          await this.db.execute(upsertQuery, [
            equipoId,
            registroAleatorio.latitud,
            registroAleatorio.longitud,
            registroAleatorio.velocidad,
            registroAleatorio.timestamp
          ]);
        }
      }
      
      return res.status(200).json(
        new ApiResponse(true, 'Datos de prueba generados exitosamente', {
          equipos: equiposId,
          registrosPorEquipo,
          totalRegistros: registrosPorEquipo * equiposId.length
        })
      );
    } catch (error) {
      console.error('[GpsController] Error al generar datos de prueba para GPS:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al generar datos de prueba para GPS', null)
      );
    }
  }
} 
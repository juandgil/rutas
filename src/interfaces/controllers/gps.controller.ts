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
    @inject(TYPES.IPubSubService) private pubSubService: IPubSubService
  ) {}

  /**
   * @swagger
   * /gps/ubicacion/{equipoId}:
   *   get:
   *     summary: Obtiene la ubicación actual de un equipo
   *     tags: [GPS]
   *     parameters:
   *       - in: path
   *         name: equipoId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del equipo
   *     responses:
   *       200:
   *         description: Ubicación GPS actual o mensaje informativo
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   nullable: true
   *       500:
   *         description: Error del servidor
   */
  @httpGet('/ubicacion/:equipoId')
  async getUbicacion(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const equipoId = req.params.equipoId;
      
      // Verificar que el equipo existe
      const equipo = await this.equipoRepository.findById(equipoId);
      if (!equipo) {
        return res.status(200).json(
          new ApiResponse(false, 'Equipo no encontrado', null)
        );
      }
      
      // Obtener la última ubicación GPS registrada
      const ultimaUbicacion = await this.gpsRepository.findUltimaUbicacion(equipoId);
      
      if (!ultimaUbicacion) {
        // Si no hay registros, crear una ubicación inicial genérica
        const ubicacionPredeterminada = await this.crearUbicacionPredeterminada(equipoId);
        
        const ubicacion: GpsUbicacion = {
          equipoId,
          latitud: ubicacionPredeterminada.latitud,
          longitud: ubicacionPredeterminada.longitud,
          velocidad: ubicacionPredeterminada.velocidad,
          timestamp: ubicacionPredeterminada.timestamp
        };
        
        return res.status(200).json(
          new ApiResponse(true, 'Ubicación GPS inicial (creada automáticamente)', ubicacion)
        );
      }
      
      // Mapear el registro a la interfaz de GpsUbicacion
      const ubicacion: GpsUbicacion = {
        equipoId,
        latitud: ultimaUbicacion.latitud,
        longitud: ultimaUbicacion.longitud,
        velocidad: ultimaUbicacion.velocidad,
        timestamp: ultimaUbicacion.timestamp
      };
      
      return res.status(200).json(
        new ApiResponse(true, 'Ubicación GPS actual', ubicacion)
      );
    } catch (error) {
      console.error('Error al obtener ubicación GPS:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al consultar la ubicación GPS', null)
      );
    }
  }

  /**
   * @swagger
   * /gps/historico/{equipoId}:
   *   get:
   *     summary: Obtiene el historial de ubicaciones GPS de un equipo
   *     tags: [GPS]
   *     parameters:
   *       - in: path
   *         name: equipoId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del equipo
   *       - in: query
   *         name: desde
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha y hora de inicio (ISO 8601)
   *       - in: query
   *         name: hasta
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha y hora de fin (ISO 8601)
   *     responses:
   *       200:
   *         description: Historial de ubicaciones GPS
   *       400:
   *         description: Parámetros inválidos
   *       404:
   *         description: Equipo no encontrado
   *       500:
   *         description: Error del servidor
   */
  @httpGet('/historico/:equipoId')
  async getHistorico(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const equipoId = req.params.equipoId;
      const desdeStr = req.query.desde as string;
      const hastaStr = req.query.hasta as string;
      
      // Verificar que el equipo existe
      const equipo = await this.equipoRepository.findById(equipoId);
      if (!equipo) {
        return res.status(404).json(
          new ApiResponse(false, 'Equipo no encontrado', null)
        );
      }
      
      // Validar los parámetros de fecha
      let desde: Date;
      let hasta: Date;
      
      if (!desdeStr || !hastaStr) {
        // Si no se especifican fechas, usar las últimas 24 horas
        hasta = new Date();
        desde = new Date(hasta.getTime() - 24 * 60 * 60 * 1000);
      } else {
        try {
          desde = new Date(desdeStr);
          hasta = new Date(hastaStr);
          
          // Validar que son fechas válidas
          if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) {
            throw new Error('Fechas inválidas');
          }
          
          // Validar que el rango no es muy grande (máximo 7 días)
          const diffDays = (hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) {
            return res.status(400).json(
              new ApiResponse(false, 'El rango de fechas no puede ser mayor a 7 días', null)
            );
          }
        } catch (err) {
          return res.status(400).json(
            new ApiResponse(false, 'Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)', null)
          );
        }
      }
      
      // Obtener registros GPS en el rango de fechas
      const registros = await this.gpsRepository.findByEquipoYRango(equipoId, desde, hasta);
      
      // Mapear los registros a la interfaz de GpsUbicacion
      const ubicaciones: GpsUbicacion[] = registros.map((reg: Gps) => ({
        equipoId: reg.equipoId,
        latitud: reg.latitud,
        longitud: reg.longitud,
        velocidad: reg.velocidad,
        timestamp: reg.timestamp
      }));
      
      return res.status(200).json(
        new ApiResponse(true, `Se encontraron ${ubicaciones.length} registros GPS`, ubicaciones)
      );
    } catch (error) {
      console.error('Error al obtener historial GPS:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al consultar el historial GPS', null)
      );
    }
  }

  /**
   * @swagger
   * /gps/ubicacion:
   *   post:
   *     summary: Registra una nueva ubicación GPS para un equipo
   *     tags: [GPS]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GpsUbicacion'
   *     responses:
   *       201:
   *         description: Ubicación registrada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/GpsUbicacion'
   *       202:
   *         description: Ubicación en procesamiento (modo asíncrono)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Equipo no encontrado
   *       500:
   *         description: Error al registrar ubicación
   */
  @httpPost('/ubicacion')
  async registrarUbicacion(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const { equipoId, latitud, longitud, velocidad, timestamp } = req.body;

      // Verificar datos requeridos
      if (!equipoId || !latitud || !longitud) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos',
          details: 'Se requiere equipoId, latitud y longitud'
        });
      }

      // Crear objeto GPS
      const ubicacion: Gps = {
        id: uuidv4(),
        equipoId,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        velocidad: velocidad ? parseFloat(velocidad) : 0,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        createdAt: new Date()
      };

      // Procesar de forma asíncrona usando PubSub
      console.log(`Publicando ubicación GPS para equipo ${equipoId} en PubSub`);
      await this.pubSubService.publicar('gps-updates', ubicacion);

      // Responder inmediatamente
      return res.status(202).json({
        success: true,
        message: 'Ubicación GPS registrada para procesamiento asíncrono',
        data: {
          equipoId,
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
          procesadaAsincrona: true
        }
      });
    } catch (error) {
      console.error('Error al registrar ubicación GPS:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al registrar ubicación GPS',
        error: (error as Error).message
      });
    }
  }

  /**
   * Crea una ubicación predeterminada para un equipo que no tiene registros previos
   */
  private async crearUbicacionPredeterminada(equipoId: string): Promise<Gps> {
    // Coordenadas predeterminadas para Bogotá
    const coordenadasPredeterminadas: Record<string, { lat: number; lng: number }> = {
      'equipo-001': { lat: 4.65, lng: -74.05 },
      'equipo-002': { lat: 4.61, lng: -74.08 },
      'equipo-003': { lat: 4.70, lng: -74.04 },
      'equipo-004': { lat: 4.67, lng: -74.07 },
      'default': { lat: 4.63, lng: -74.06 } // Coordenadas por defecto
    };
    
    // Obtener coordenadas según el equipo o usar las predeterminadas
    const coords = equipoId in coordenadasPredeterminadas 
      ? coordenadasPredeterminadas[equipoId] 
      : coordenadasPredeterminadas['default'];
    
    // Crear un nuevo registro GPS
    const ubicacion = new Gps({
      id: uuidv4(),
      equipoId,
      latitud: coords.lat,
      longitud: coords.lng,
      velocidad: 0, // Detenido
      timestamp: new Date(),
      createdAt: new Date()
    });
    
    // Guardar en la base de datos
    return await this.gpsRepository.create(ubicacion);
  }

  // Método auxiliar para validar números
  private esNumero(valor: any): boolean {
    return typeof valor === 'number' && !isNaN(valor);
  }
} 
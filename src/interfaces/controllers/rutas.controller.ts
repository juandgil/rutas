import { Request, Response } from 'express';
import { controller, httpGet, httpPut, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '../../infrastructure/ioc/types';
import { IOptimizacionService } from '../../application/interfaces/optimizacion-service.interface';
import { OptimizarRutaRequestDto, ReplanificarRutaRequestDto, RutaResponseDto, EnvioRutaDto } from '../../application/dtos/ruta.dto';
import { IEnvioRepository } from '../../domain/repositories/envio.repository';
import { ISlaRepository } from '../../domain/repositories/sla.repository';
import { Envio } from '../../domain/entities/envio.entity';
import { Sla } from '../../domain/entities/sla.entity';
import * as express from 'express';

/**
 * @swagger
 * tags:
 *   name: Rutas
 *   description: Endpoints para gestión y optimización de rutas
 */
@controller('/api/rutas')
export class RutasController {
  constructor(
    @inject(TYPES.IOptimizacionService) private optimizacionService: IOptimizacionService,
    @inject(TYPES.IEnvioRepository) private envioRepository: IEnvioRepository,
    @inject(TYPES.ISlaRepository) private slaRepository: ISlaRepository
  ) {}

  /**
   * @swagger
   * /api/rutas/optimizar/{equipoId}:
   *   get:
   *     summary: Calcular la ruta óptima para un equipo
   *     tags: [Rutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: equipoId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del equipo para el que se optimizará la ruta
   *       - in: query
   *         name: fecha
   *         schema:
   *           type: string
   *           format: date
   *         description: Fecha para la que se optimizará la ruta (formato YYYY-MM-DD). Por defecto es la fecha actual.
   *     responses:
   *       200:
   *         description: Ruta optimizada creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ruta'
   *       400:
   *         description: Error en la solicitud o en los parámetros
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado, token inválido o expirado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Prohibido, el usuario no tiene permisos suficientes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  @httpGet('/optimizar/:equipoId')
  async optimizarRuta(@request() req: Request, @response() res: Response): Promise<Response> {
    // Verificar autenticación y roles
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    try {
      // Validar datos de entrada
      const { equipoId } = req.params;
      const fecha = req.query.fecha ? new Date(req.query.fecha as string) : new Date();
      
      const optimizarRequest = new OptimizarRutaRequestDto({ equipoId, fecha });
      
      try {
        await OptimizarRutaRequestDto.validationSchema.validate(optimizarRequest);
      } catch (validationError: any) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: validationError.message
        });
      }

      // Optimizar ruta
      const rutaOptimizada = await this.optimizacionService.optimizarRuta(equipoId, fecha);
      
      // Obtener información de los envíos para la respuesta
      const enviosInfo = await this.obtenerInfoEnvios(rutaOptimizada.envios);
      
      // Crear respuesta
      const response = new RutaResponseDto({
        id: rutaOptimizada.id,
        equipoId: rutaOptimizada.equipoId,
        fecha: rutaOptimizada.fecha,
        envios: enviosInfo,
        estado: rutaOptimizada.estado,
        distanciaTotal: rutaOptimizada.distanciaTotal,
        tiempoEstimado: rutaOptimizada.tiempoEstimado,
        replanificada: rutaOptimizada.replanificada,
        ultimoEventoId: rutaOptimizada.ultimoEventoId
      });
      
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al optimizar ruta:', error);
      
      // Determinar el código de error apropiado
      if (error.message.includes('Ya existe una ruta optimizada') ||
          error.message.includes('No hay envíos pendientes') ||
          error.message.includes('No hay envíos que puedan caber') ||
          error.message.includes('Equipo no encontrado') ||
          error.message.includes('Vehículo no encontrado')) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * @swagger
   * /api/rutas/replanificar/{equipoId}:
   *   put:
   *     summary: Replanificar la ruta de un equipo debido a un evento inesperado
   *     tags: [Rutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: equipoId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del equipo para el que se replanificará la ruta
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - eventoId
   *             properties:
   *               eventoId:
   *                 type: string
   *                 description: ID del evento que causó la replanificación
   *           example:
   *             eventoId: ev-001
   *     responses:
   *       200:
   *         description: Ruta replanificada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ruta'
   *       400:
   *         description: Error en la solicitud o en los parámetros
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado, token inválido o expirado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Prohibido, el usuario no tiene permisos suficientes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: No se encontró la ruta para replanificar
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  @httpPut('/replanificar/:equipoId')
  async replanificarRuta(@request() req: Request, @response() res: Response): Promise<Response> {
    // Verificar autenticación y roles
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    try {
      // Validar datos de entrada
      const { equipoId } = req.params;
      const { eventoId } = req.body;
      
      const replanificarRequest = new ReplanificarRutaRequestDto({ equipoId, eventoId });
      
      try {
        await ReplanificarRutaRequestDto.validationSchema.validate(replanificarRequest);
      } catch (validationError: any) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: validationError.message
        });
      }

      // Verificar si se puede replanificar
      const sePuedeReplanificar = await this.optimizacionService.validarReplanificacion(equipoId, eventoId);
      
      if (!sePuedeReplanificar) {
        return res.status(400).json({
          error: 'Esta ruta ya fue replanificada por este evento'
        });
      }

      // Replanificar ruta
      const rutaReplanificada = await this.optimizacionService.replanificarRuta(equipoId, eventoId);
      
      if (!rutaReplanificada) {
        return res.status(404).json({
          error: 'No se encontró ruta para replanificar'
        });
      }
      
      // Obtener información de los envíos para la respuesta
      const enviosInfo = await this.obtenerInfoEnvios(rutaReplanificada.envios);
      
      // Crear respuesta
      const response = new RutaResponseDto({
        id: rutaReplanificada.id,
        equipoId: rutaReplanificada.equipoId,
        fecha: rutaReplanificada.fecha,
        envios: enviosInfo,
        estado: rutaReplanificada.estado,
        distanciaTotal: rutaReplanificada.distanciaTotal,
        tiempoEstimado: rutaReplanificada.tiempoEstimado,
        replanificada: rutaReplanificada.replanificada,
        ultimoEventoId: rutaReplanificada.ultimoEventoId
      });
      
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al replanificar ruta:', error);
      
      // Determinar el código de error apropiado
      if (error.message.includes('Evento no encontrado') ||
          error.message.includes('El evento ya no está activo') ||
          error.message.includes('Esta ruta ya fue replanificada') ||
          error.message.includes('No hay una ruta para replanificar') ||
          error.message.includes('Solo se pueden replanificar rutas en progreso') ||
          error.message.includes('No hay envíos pendientes para replanificar') ||
          error.message.includes('No se encontró la ubicación actual del equipo')) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Método auxiliar para obtener información detallada de los envíos
  private async obtenerInfoEnvios(enviosIds: string[]): Promise<EnvioRutaDto[]> {
    // Obtener todos los SLAs
    const slas = await this.slaRepository.findAll();
    const slasMap = new Map<string, Sla>();
    slas.forEach(sla => slasMap.set(sla.id, sla));
    
    // Obtener los envíos
    const enviosPromises = enviosIds.map(id => this.envioRepository.findById(id));
    const envios = await Promise.all(enviosPromises);
    
    // Filtrar envíos nulos
    const enviosValidos = envios.filter((e): e is Envio => e !== null);
    
    // Transformar a DTOs
    return enviosValidos.map(envio => {
      const sla = slasMap.get(envio.slaId);
      return new EnvioRutaDto({
        id: envio.id,
        guia: envio.guia,
        direccionDestino: envio.direccionDestino,
        latitudDestino: envio.latitudDestino,
        longitudDestino: envio.longitudDestino,
        ordenEntrega: envio.ordenEntrega || 0,
        slaId: envio.slaId,
        prioridadSla: sla?.prioridad || 5
      });
    });
  }
} 
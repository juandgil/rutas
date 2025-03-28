import { Request, Response } from 'express';
import { controller, httpPost, httpGet, httpPut, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '../../infrastructure/ioc/types';
import { IEventoService } from '../../application/interfaces/evento-service.interface';
import { CrearEventoDto, EventoResponseDto } from '../../application/dtos/evento.dto';
import { Evento } from '../../domain/entities/evento.entity';

/**
 * @swagger
 * tags:
 *   name: Eventos
 *   description: Endpoints para registro, consulta y gestión de eventos inesperados que afectan las rutas de entrega, como accidentes, bloqueos viales, condiciones climáticas adversas, etc.
 */
@controller('/api/eventos')
export class EventosController {
  constructor(
    @inject(TYPES.IEventoService) private eventoService: IEventoService
  ) {}

  /**
   * @swagger
   * /api/eventos:
   *   post:
   *     summary: Registrar un nuevo evento inesperado
   *     tags: [Eventos]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tipo
   *               - descripcion
   *               - ciudadId
   *             properties:
   *               tipo:
   *                 type: string
   *                 enum: [TRAFICO, CLIMA, VEHICULO, CANCELACION, OTRO]
   *                 description: Tipo de evento
   *               descripcion:
   *                 type: string
   *                 description: Descripción detallada del evento
   *               latitud:
   *                 type: number
   *                 format: float
   *                 description: Latitud donde ocurrió el evento
   *               longitud:
   *                 type: number
   *                 format: float
   *                 description: Longitud donde ocurrió el evento
   *               ciudadId:
   *                 type: string
   *                 description: ID de la ciudad afectada
   *               equipoId:
   *                 type: string
   *                 description: ID del equipo afectado (opcional)
   *               impacto:
   *                 type: string
   *                 enum: [BAJO, MEDIO, ALTO, CRITICO]
   *                 description: Nivel de impacto estimado del evento
   *               metadatos:
   *                 type: object
   *                 description: Datos adicionales específicos del evento
   *           example:
   *             tipo: TRAFICO
   *             descripcion: "Cierre vial por manifestación"
   *             latitud: 4.6782
   *             longitud: -74.0582
   *             ciudadId: bogota
   *             equipoId: eq-001
   *             impacto: ALTO
   *     responses:
   *       201:
   *         description: Evento registrado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Evento'
   *       400:
   *         description: Datos de entrada inválidos
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
  @httpPost('/')
  async registrarEvento(@request() req: Request, @response() res: Response): Promise<Response> {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    try {
      // Validar datos de entrada
      const eventoDto = new CrearEventoDto(req.body);
      
      try {
        await CrearEventoDto.validationSchema.validate(eventoDto);
      } catch (validationError: any) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: validationError.message
        });
      }

      // Registrar evento
      const eventoCreado = await this.eventoService.registrarEvento(eventoDto);
      
      // Crear respuesta
      const response = this.mapToResponseDto(eventoCreado);
      
      return res.status(201).json(response);
    } catch (error: any) {
      console.error('Error al registrar evento:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * @swagger
   * /api/eventos/activos:
   *   get:
   *     summary: Obtener todos los eventos activos
   *     tags: [Eventos]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de eventos activos
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Evento'
   *       401:
   *         description: No autorizado, token inválido o expirado
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
  @httpGet('/activos')
  async obtenerEventosActivos(@request() req: Request, @response() res: Response): Promise<Response> {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    try {
      const eventos = await this.eventoService.obtenerEventosActivos();
      const response = eventos.map(e => this.mapToResponseDto(e));
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al obtener eventos activos:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * @swagger
   * /api/eventos/ciudad/{ciudadId}:
   *   get:
   *     summary: Obtener eventos de una ciudad específica
   *     tags: [Eventos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ciudadId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la ciudad
   *     responses:
   *       200:
   *         description: Lista de eventos de la ciudad
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Evento'
   *       401:
   *         description: No autorizado, token inválido o expirado
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
  @httpGet('/ciudad/:ciudadId')
  async obtenerEventosPorCiudad(@request() req: Request, @response() res: Response): Promise<Response> {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    try {
      const { ciudadId } = req.params;
      const eventos = await this.eventoService.obtenerEventosPorCiudad(ciudadId);
      const response = eventos.map(e => this.mapToResponseDto(e));
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al obtener eventos por ciudad:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * @swagger
   * /api/eventos/equipo/{equipoId}:
   *   get:
   *     summary: Obtener eventos asociados a un equipo
   *     tags: [Eventos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: equipoId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del equipo
   *     responses:
   *       200:
   *         description: Lista de eventos del equipo
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Evento'
   *       401:
   *         description: No autorizado, token inválido o expirado
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
  @httpGet('/equipo/:equipoId')
  async obtenerEventosPorEquipo(@request() req: Request, @response() res: Response): Promise<Response> {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    try {
      const { equipoId } = req.params;
      const eventos = await this.eventoService.obtenerEventosPorEquipo(equipoId);
      const response = eventos.map(e => this.mapToResponseDto(e));
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al obtener eventos por equipo:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * @swagger
   * /api/eventos/{id}/inactivar:
   *   put:
   *     summary: Marcar un evento como inactivo
   *     tags: [Eventos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del evento a inactivar
   *     responses:
   *       200:
   *         description: Evento inactivado exitosamente o mensaje informativo
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/Evento'
   *                 - type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                     message:
   *                       type: string
   *                       description: Mensaje informativo (Evento no encontrado, etc)
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
  @httpPut('/:id/inactivar')
  async marcarInactivo(@request() req: Request, @response() res: Response): Promise<Response> {
    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    try {
      const { id } = req.params;
      const evento = await this.eventoService.marcarInactivo(id);
      const response = this.mapToResponseDto(evento);
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al marcar evento como inactivo:', error);
      
      if (error.message.includes('No se encontró el evento')) {
        return res.status(200).json({ 
          success: false,
          message: 'Evento no encontrado' 
        });
      }
      
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Método auxiliar para mapear evento a DTO
  private mapToResponseDto(evento: Evento): EventoResponseDto {
    return new EventoResponseDto({
      id: evento.id,
      equipoId: evento.equipoId,
      tipo: evento.tipo,
      descripcion: evento.descripcion,
      latitud: evento.latitud,
      longitud: evento.longitud,
      ciudadId: evento.ciudadId,
      impacto: evento.impacto,
      fecha: evento.fecha,
      activo: evento.activo
    });
  }
} 
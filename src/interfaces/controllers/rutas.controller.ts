import { Request, Response } from 'express';
import { controller, httpGet, httpPost, httpPut, request, response, requestParam } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '../../infrastructure/ioc/types';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { IOptimizacionService } from '../../application/interfaces/optimizacion-service.interface';
import { IEventoService } from '../../application/interfaces/evento-service.interface';
import { IRutaRepository } from '../../domain/repositories/ruta.repository';
import { IEquipoRepository } from '../../domain/repositories/equipo.repository';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../dtos/common.dto';

/**
 * @swagger
 * tags:
 *   name: Rutas
 *   description: Endpoints para optimización, planificación y seguimiento de rutas de entrega
 */
@controller('/rutas')
export class RutasController {
  private readonly REQUEST_TIMEOUT = 120000; // 2 minutos

  constructor(
    @inject(TYPES.IPubSubService) private pubSubService: IPubSubService,
    @inject(TYPES.IOptimizacionService) private optimizacionService: IOptimizacionService,
    @inject(TYPES.IEventoService) private eventoService: IEventoService,
    @inject(TYPES.IRutaRepository) private rutaRepository: IRutaRepository,
    @inject(TYPES.IEquipoRepository) private equipoRepository: IEquipoRepository
  ) {}

  /**
   * @swagger
   * /rutas/optimizar/{equipoId}:
   *   get:
   *     summary: Calcula la ruta óptima para un equipo
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
   *         example: "equipo-001"
   *       - in: query
   *         name: fecha
   *         schema:
   *           type: string
   *           format: date
   *         description: Fecha para la que se optimizará la ruta (formato YYYY-MM-DD)
   *         example: "2025-03-31"
   *     responses:
   *       200:
   *         description: Ruta optimizada exitosamente
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
   *                   $ref: '#/components/schemas/RutaResponseDto'
   *       202:
   *         description: Optimización de ruta en procesamiento (modo asíncrono)
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
   *                     requestId:
   *                       type: string
   *       404:
   *         description: Equipo no encontrado
   *       500:
   *         description: Error al optimizar ruta
   */
  @httpGet('/optimizar/:equipoId')
  async optimizarRuta(@request() req: Request, @response() res: Response): Promise<Response> {
    const { equipoId } = req.params;
    const { fecha } = req.query;
    const requestId = uuidv4();
    
    try {
      // Validar que el equipo existe
      const equipo = await this.equipoRepository.findById(equipoId);
      if (!equipo) {
        return res.status(404).json(
          new ApiResponse(false, 'Equipo no encontrado', null)
        );
      }

      // Validar formato de fecha si se proporciona
      let fechaObj: Date;
      if (fecha) {
        fechaObj = new Date(fecha as string);
        if (isNaN(fechaObj.getTime())) {
          return res.status(400).json(
            new ApiResponse(false, 'Formato de fecha inválido. Use YYYY-MM-DD', null)
          );
        }
      } else {
        fechaObj = new Date();
      }
      
      // Normalizar la fecha para eliminar la hora/minutos/segundos
      fechaObj.setHours(0, 0, 0, 0);
      console.log(`[RutasController] Fecha normalizada: ${fechaObj.toISOString()}`);

      // Verificar si ya existe una ruta para esta fecha
      const rutaExistente = await this.rutaRepository.findByEquipoAndDate(equipoId, fechaObj);
      if (rutaExistente) {
        console.log(`[RutasController] Ruta existente encontrada: ${rutaExistente.id}`);
        return res.status(200).json(
          new ApiResponse(true, 'Ya existe una ruta para este equipo y fecha', rutaExistente)
        );
      }

      // Iniciar procesamiento asíncrono
      console.log(`Iniciando optimización asíncrona para equipo ${equipoId}, requestId: ${requestId}`);
      
      // Publicar mensaje para procesar asíncronamente
      await this.pubSubService.publicar('route-optimizations', {
        equipoId,
        fecha: fechaObj.toISOString().split('T')[0],
        requestId
      });
      
      // Esperar por el resultado o timeout
      const result = await this.waitForResult(requestId);
      
      if (!result) {
        return res.status(202).json(
          new ApiResponse(true, 'La optimización de ruta está en proceso. Intente consultar el estado más tarde.', { 
            requestId, 
            equipoId 
          })
        );
      }
      
      if (!result.success) {
        return res.status(400).json(
          new ApiResponse(false, 'Error al optimizar ruta', { 
            requestId, 
            equipoId,
            error: result.error
          })
        );
      }
      
      return res.status(200).json(
        new ApiResponse(true, 'Ruta optimizada correctamente', result.ruta)
      );
    } catch (error) {
      console.error(`Error al optimizar ruta: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al optimizar ruta', { 
          requestId, 
          error: (error as Error).message 
        })
      );
    }
  }

  /**
   * @swagger
   * /rutas/replanificar/{equipoId}:
   *   put:
   *     summary: Replanifica la ruta de un equipo debido a un evento inesperado
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
   *         example: "equipo-001"
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
   *                 description: ID del evento que provoca la replanificación
   *           example:
   *             eventoId: "ev-001"
   *     responses:
   *       200:
   *         description: Ruta replanificada exitosamente
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
   *                   $ref: '#/components/schemas/RutaResponseDto'
   *       202:
   *         description: Replanificación en procesamiento (modo asíncrono)
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
   *                     requestId:
   *                       type: string
   *       400:
   *         description: Datos inválidos o incompletos
   *       404:
   *         description: Equipo o evento no encontrado
   *       500:
   *         description: Error al replanificar ruta
   */
  @httpPost('/replanificar')
  async replanificarRuta(@request() req: Request, @response() res: Response): Promise<Response> {
    const { equipoId, eventoId } = req.body;
    const requestId = uuidv4();
    
    try {
      // Validar datos de entrada
      if (!equipoId || !eventoId) {
        return res.status(400).json(
          new ApiResponse(false, 'Se requiere equipoId y eventoId', null)
        );
      }

      // Validar que el equipo existe
      const equipo = await this.equipoRepository.findById(equipoId);
      if (!equipo) {
        return res.status(404).json(
          new ApiResponse(false, 'Equipo no encontrado', null)
        );
      }

      // Validar que el evento existe
      const evento = await this.eventoService.obtenerEvento(eventoId);
      if (!evento) {
        return res.status(404).json(
          new ApiResponse(false, 'Evento no encontrado', null)
        );
      }

      // Iniciar procesamiento asíncrono
      console.log(`Iniciando replanificación asíncrona para equipo ${equipoId}, evento ${eventoId}, requestId: ${requestId}`);
      
      // Publicar mensaje para procesar asíncronamente
      await this.pubSubService.publicar('route-replanifications', {
        equipoId,
        eventoId,
        requestId
      });
      
      // Esperar por el resultado o timeout
      const result = await this.waitForResult(requestId);
      
      if (!result) {
        return res.status(202).json(
          new ApiResponse(true, 'La replanificación de ruta está en proceso. Intente consultar el estado más tarde.', { 
            requestId, 
            equipoId,
            eventoId 
          })
        );
      }
      
      if (!result.success) {
        return res.status(400).json(
          new ApiResponse(false, 'Error al replanificar ruta', { 
            requestId, 
            equipoId,
            eventoId,
            error: result.error
          })
        );
      }
      
      return res.status(200).json(
        new ApiResponse(true, 'Ruta replanificada correctamente', result.ruta)
      );
    } catch (error) {
      console.error(`Error al replanificar ruta: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al replanificar ruta', { 
          requestId, 
          error: (error as Error).message 
        })
      );
    }
  }

  /**
   * Obtiene la ruta actual de un equipo
   * @route GET /rutas/:equipoId
   */
  @httpGet('/:equipoId')
  async obtenerRutaActual(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const { equipoId } = req.params;
      const fecha = new Date();

      // Obtener ruta actual
      const ruta = await this.rutaRepository.findByEquipoAndDate(equipoId, fecha);

      if (!ruta) {
        return res.status(404).json(
          new ApiResponse(false, 'No se encontró una ruta para el equipo en la fecha actual', null)
        );
      }

      return res.status(200).json(
        new ApiResponse(true, 'Ruta obtenida correctamente', ruta)
      );
    } catch (error) {
      console.error(`Error al obtener ruta: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al obtener ruta', { error: (error as Error).message })
      );
    }
  }

  /**
   * Obtiene una ruta por su ID
   * @route GET /rutas/detalle/:id
   */
  @httpGet('/detalle/:id')
  async obtenerRutaPorId(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // Obtener ruta por ID
      const ruta = await this.rutaRepository.findById(id);

      if (!ruta) {
        return res.status(404).json(
          new ApiResponse(false, 'Ruta no encontrada', null)
        );
      }

      return res.status(200).json(
        new ApiResponse(true, 'Ruta obtenida correctamente', ruta)
      );
    } catch (error) {
      console.error(`Error al obtener ruta: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al obtener ruta', { error: (error as Error).message })
      );
    }
  }

  /**
   * @swagger
   * /rutas/optimizar-ciudad/{ciudadId}:
   *   post:
   *     summary: Optimiza las rutas de todos los equipos disponibles en una ciudad
   *     tags: [Rutas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ciudadId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la ciudad para la que se optimizarán las rutas
   *         example: "ciudad-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fecha:
   *                 type: string
   *                 format: date
   *                 description: Fecha para la que se optimizarán las rutas (formato YYYY-MM-DD)
   *           example:
   *             fecha: "2023-11-15"
   *     responses:
   *       200:
   *         description: Rutas optimizadas exitosamente
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
   *                     rutasCreadas:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Ruta'
   *                     enviosAsignados:
   *                       type: integer
   *                     equiposOptimizados:
   *                       type: integer
   *       400:
   *         description: Datos inválidos o incompletos
   *       404:
   *         description: Ciudad no encontrada o sin equipos disponibles
   *       500:
   *         description: Error al optimizar rutas
   */
  @httpPost('/optimizar-ciudad/:ciudadId')
  async optimizarRutasCiudad(@request() req: Request, @response() res: Response): Promise<Response> {
    const { ciudadId } = req.params;
    const { fecha } = req.body;
    
    try {
      // Validar formato de fecha
      let fechaObj: Date;
      if (fecha) {
        fechaObj = new Date(fecha);
        if (isNaN(fechaObj.getTime())) {
          return res.status(400).json(
            new ApiResponse(false, 'Formato de fecha inválido. Use YYYY-MM-DD', null)
          );
        }
      } else {
        fechaObj = new Date();
      }
      
      // Normalizar la fecha para eliminar la hora/minutos/segundos
      fechaObj.setHours(0, 0, 0, 0);
      console.log(`[RutasController] Fecha normalizada para optimización masiva: ${fechaObj.toISOString()}`);
      
      // Ejecutar optimización masiva
      console.log(`Iniciando optimización masiva para ciudad ${ciudadId}, fecha: ${fechaObj.toISOString().split('T')[0]}`);
      
      const resultado = await this.optimizacionService.optimizarRutasMasivas(ciudadId, fechaObj);
      console.log(`Optimización masiva completada. Rutas creadas: ${resultado.rutasCreadas.length}, Envíos asignados: ${resultado.enviosAsignados}`);
      
      if (resultado.rutasCreadas.length === 0) {
        return res.status(200).json(
          new ApiResponse(true, 'No se pudieron crear rutas. Posibles causas: no hay equipos disponibles, no hay envíos pendientes, o todas las rutas ya están planificadas.', {
            rutasCreadas: [],
            enviosAsignados: 0,
            equiposOptimizados: 0
          })
        );
      }
      
      return res.status(200).json(
        new ApiResponse(true, `Optimización masiva completada. Se crearon ${resultado.rutasCreadas.length} rutas con ${resultado.enviosAsignados} envíos asignados.`, resultado)
      );
    } catch (error) {
      console.error(`Error al optimizar rutas por ciudad: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al optimizar rutas por ciudad', { error: (error as Error).message })
      );
    }
  }

  /**
   * Espera el resultado de una operación asíncrona o retorna null en caso de timeout
   */
  private async waitForResult(requestId: string): Promise<any> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      let resultReceived = false;
      
      // Configurar timeout
      timeoutId = setTimeout(() => {
        if (!resultReceived) {
          console.log(`Timeout para requestId: ${requestId}`);
          try {
            this.pubSubService.cancelarSuscripcion(`rutas-events-result-listener`)
              .catch(err => console.error(`Error al cancelar suscripción: ${err.message}`));
          } catch (error) {
            console.error(`Error al intentar cancelar suscripción: ${error}`);
          }
          resolve(null);
        }
      }, this.REQUEST_TIMEOUT);
      
      // Suscribirse para recibir el resultado
      try {
        this.pubSubService.suscribir<any>(
          'route-optimizations-results',
          async (mensaje) => {
            try {
              // Solo procesar mensajes para este requestId
              if (mensaje && mensaje.requestId === requestId) {
                console.log(`Resultado recibido para requestId: ${requestId}`);
                resultReceived = true;
                clearTimeout(timeoutId);
                
                try {
                  await this.pubSubService.cancelarSuscripcion(`rutas-events-result-listener`);
                } catch (error) {
                  console.error(`Error al cancelar suscripción tras recibir respuesta: ${error}`);
                  // Continuamos a pesar del error
                }
                
                resolve(mensaje);
              }
            } catch (error) {
              console.error(`Error procesando mensaje para requestId ${requestId}: ${error}`);
              // No resolvemos aquí para permitir que el timeout maneje el caso
            }
          },
          `rutas-events-result-listener`
        ).catch(error => {
          console.error(`Error al suscribirse a resultados: ${error}`);
          // En caso de error en la suscripción, esperamos el timeout
        });
      } catch (error) {
        console.error(`Error crítico al intentar suscribirse: ${error}`);
        clearTimeout(timeoutId);
        // Resolvemos con null para evitar que la promesa quede pendiente
        resolve(null);
      }
    });
  }
} 
import { inject, injectable } from 'inversify';
import { TYPES } from '../ioc/types';
import { IGpsRepository } from '../../domain/repositories/gps.repository';
import { IOptimizacionService } from '../../application/interfaces/optimizacion-service.interface';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { Gps } from '../../domain/entities/gps.entity';
import { IEventoService } from '../../application/interfaces/evento-service.interface';
import { IEquipoRepository } from '../../domain/repositories/equipo.repository';

/**
 * Manejador de mensajes para el sistema PubSub
 * Se encarga de procesar los mensajes recibidos de diferentes tipos
 */
@injectable()
export class PubSubMessageHandlers {
  private readonly USER_ID = process.env.USER_ID || 'default-user';
  private subscriptionIds: string[] = [];

  constructor(
    @inject(TYPES.IGpsRepository) private gpsRepository: IGpsRepository,
    @inject(TYPES.IOptimizacionService) private optimizacionService: IOptimizacionService,
    @inject(TYPES.IEventoService) private eventoService: IEventoService,
    @inject(TYPES.IEquipoRepository) private equipoRepository: IEquipoRepository,
    @inject(TYPES.IPubSubService) private pubSubService: IPubSubService
  ) {
    console.log('Inicializando manejadores de mensajes PubSub');
    this.initializeSubscriptions();
  }
  
  /**
   * Inicializa las suscripciones a los diferentes tipos de mensajes
   */
  private async initializeSubscriptions() {
    console.log('Inicializando suscripciones PubSub');
    
    try {
      // Intentar inicializar cada suscripción por separado para que el fallo de una no afecte a las demás
      const subscriptionPromises = [
        this.subscribeSafely<Gps>('gps-updates', async (mensaje: Gps) => this.handleGpsUpdate(mensaje)),
        this.subscribeSafely<{equipoId: string, fecha: string, requestId: string}>('route-optimizations', 
          async (mensaje: {equipoId: string, fecha: string, requestId: string}) => this.handleRouteOptimization(mensaje)),
        this.subscribeSafely<{equipoId: string, eventoId: string, requestId: string}>('route-replanifications', 
          async (mensaje: {equipoId: string, eventoId: string, requestId: string}) => this.handleRouteReplanification(mensaje)),
        this.subscribeSafely<any>('delivery-events', async (mensaje: any) => this.handleDeliveryEvent(mensaje))
      ];
      
      // Esperar a que todas las suscripciones se completen (o fallen)
      const results = await Promise.allSettled(subscriptionPromises);
      
      // Contar suscripciones exitosas
      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`Sistema suscrito a ${successful} de ${subscriptionPromises.length} tipos de mensajes`);
      
      if (successful > 0) {
        console.log(`Manejadores de mensajes PubSub inicializados correctamente`);
      } else {
        console.error('No se pudo inicializar ninguna suscripción PubSub');
      }
    } catch (error) {
      console.error('Error al inicializar manejadores de mensajes PubSub:', error);
      // No propagamos el error para evitar que falle todo el sistema
    }
  }
  
  /**
   * Método auxiliar para crear suscripciones de manera segura
   * @param topic Tema al que suscribirse
   * @param handler Manejador para los mensajes
   * @returns ID de la suscripción o null si falla
   */
  private async subscribeSafely<T>(topic: string, handler: (mensaje: T) => Promise<void>): Promise<string | null> {
    try {
      const subscriptionId = await this.pubSubService.suscribir<T>(topic, handler);
      if (subscriptionId) {
        this.subscriptionIds.push(subscriptionId);
        console.log(`Suscripción a ${topic} completada con éxito: ${subscriptionId}`);
      }
      return subscriptionId;
    } catch (error) {
      console.error(`Error al suscribirse al topic ${topic}:`, error);
      return null;
    }
  }
  
  /**
   * Maneja las actualizaciones de posición GPS
   */
  private async handleGpsUpdate(mensaje: Gps): Promise<void> {
    try {
      console.log(`Procesando actualización GPS para equipo ${mensaje.equipoId}`);
      
      // Almacenar la ubicación en la base de datos
      await this.gpsRepository.create(mensaje);
      
      // También actualizamos la ubicación en el equipo
      await this.equipoRepository.update(mensaje.equipoId, {
        latitud: mensaje.latitud,
        longitud: mensaje.longitud
      });
      
      console.log(`Ubicación GPS para equipo ${mensaje.equipoId} procesada correctamente`);
    } catch (error) {
      console.error(`Error procesando ubicación GPS:`, error);
    }
  }
  
  /**
   * Maneja las solicitudes de optimización de rutas
   */
  private async handleRouteOptimization(
    mensaje: {equipoId: string, fecha: string, requestId: string}
  ): Promise<void> {
    try {
      const { equipoId, fecha, requestId } = mensaje;
      console.log(`Procesando optimización de ruta para equipo ${equipoId}, requestId: ${requestId}`);
      
      // Procesar la optimización
      const fechaObj = new Date(fecha);
      const ruta = await this.optimizacionService.optimizarRuta(equipoId, fechaObj);
      
      // Publicar resultado
      await this.pubSubService.publicar('route-optimizations-results', {
        requestId,
        equipoId,
        success: true,
        ruta,
        processedBy: this.USER_ID
      });
      
      console.log(`Optimización de ruta para equipo ${equipoId} completada`);
    } catch (error) {
      console.error(`Error procesando optimización de ruta:`, error);
      
      // Publicar error
      await this.pubSubService.publicar('route-optimizations-results', {
        requestId: mensaje.requestId,
        equipoId: mensaje.equipoId,
        success: false,
        error: 'Error al optimizar ruta',
        processedBy: this.USER_ID
      });
    }
  }

  /**
   * Maneja las solicitudes de replanificación de rutas
   */
  private async handleRouteReplanification(
    mensaje: {equipoId: string, eventoId: string, requestId: string}
  ): Promise<void> {
    try {
      const { equipoId, eventoId, requestId } = mensaje;
      console.log(`Procesando replanificación de ruta para equipo ${equipoId}, evento ${eventoId}`);
      
      // Verificar que se puede replanificar
      const puedeReplanificar = await this.optimizacionService.validarReplanificacion(equipoId, eventoId);
      if (!puedeReplanificar) {
        await this.pubSubService.publicar('route-optimizations-results', {
          requestId,
          equipoId,
          success: false,
          error: 'No se puede replanificar la ruta con este evento',
          processedBy: this.USER_ID
        });
        return;
      }
      
      // Procesar la replanificación
      const ruta = await this.optimizacionService.replanificarRuta(equipoId, eventoId);
      
      if (!ruta) {
        await this.pubSubService.publicar('route-optimizations-results', {
          requestId,
          equipoId,
          success: false,
          error: 'No se encontró una ruta activa para replanificar',
          processedBy: this.USER_ID
        });
        return;
      }
      
      // Publicar resultado exitoso
      await this.pubSubService.publicar('route-optimizations-results', {
        requestId,
        equipoId,
        success: true,
        ruta,
        replanificada: true,
        eventoId,
        processedBy: this.USER_ID
      });
      
      console.log(`Replanificación de ruta para equipo ${equipoId} completada`);
    } catch (error) {
      console.error(`Error procesando replanificación de ruta:`, error);
      
      // Publicar error
      await this.pubSubService.publicar('route-optimizations-results', {
        requestId: mensaje.requestId,
        equipoId: mensaje.equipoId,
        success: false,
        error: 'Error al replanificar ruta',
        eventoId: mensaje.eventoId,
        processedBy: this.USER_ID
      });
    }
  }
  
  /**
   * Maneja eventos relacionados con entregas
   */
  private async handleDeliveryEvent(mensaje: any): Promise<void> {
    try {
      console.log(`Procesando evento de entrega:`, mensaje);
      
      // Aquí iría la lógica para procesar los eventos de entrega
      // Por ejemplo, actualizar el estado de los envíos, notificar a clientes, etc.
      
      console.log(`Evento de entrega procesado correctamente`);
    } catch (error) {
      console.error(`Error procesando evento de entrega:`, error);
    }
  }
  
  /**
   * Cancela todas las suscripciones al cerrar la aplicación
   */
  async cleanup(): Promise<void> {
    try {
      console.log(`Limpiando suscripciones...`);
      
      for (const subscriptionId of this.subscriptionIds) {
        await this.pubSubService.cancelarSuscripcion(subscriptionId);
      }
      
      this.subscriptionIds = [];
      console.log('Todas las suscripciones canceladas correctamente');
    } catch (error) {
      console.error('Error al limpiar suscripciones:', error);
    }
  }
} 
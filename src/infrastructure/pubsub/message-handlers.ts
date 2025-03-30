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
    try {
      // Suscripción para actualizaciones GPS
      const gpsSubscriptionId = await this.pubSubService.suscribir<Gps>(
        'gps-updates', 
        async (mensaje) => this.handleGpsUpdate(mensaje)
      );
      this.subscriptionIds.push(gpsSubscriptionId);
      
      // Suscripción para optimización de rutas
      const routeOptSubscriptionId = await this.pubSubService.suscribir<{equipoId: string, fecha: string, requestId: string}>(
        'route-optimizations', 
        async (mensaje) => this.handleRouteOptimization(mensaje)
      );
      this.subscriptionIds.push(routeOptSubscriptionId);
      
      // Suscripción para replanificación de rutas
      const routeReplanSubscriptionId = await this.pubSubService.suscribir<{equipoId: string, eventoId: string, requestId: string}>(
        'route-replanifications', 
        async (mensaje) => this.handleRouteReplanification(mensaje)
      );
      this.subscriptionIds.push(routeReplanSubscriptionId);
      
      // Suscripción para eventos de entregas
      const deliverySubscriptionId = await this.pubSubService.suscribir<any>(
        'delivery-events',
        async (mensaje) => this.handleDeliveryEvent(mensaje)
      );
      this.subscriptionIds.push(deliverySubscriptionId);
      
      console.log(`Sistema suscrito a todos los tipos de mensajes necesarios`);
      console.log(`Suscripciones activas: ${this.subscriptionIds.length}`);
    } catch (error) {
      console.error('Error al inicializar suscripciones PubSub:', error);
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
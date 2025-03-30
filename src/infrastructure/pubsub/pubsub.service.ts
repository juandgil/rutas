import { injectable } from 'inversify';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementación simple en memoria del servicio PubSub
 * En un entorno de producción, esto debería usar una tecnología como Kafka, RabbitMQ o Google PubSub
 */
@injectable()
export class InMemoryPubSubService implements IPubSubService {
  private subscriptions: Map<string, Map<string, (mensaje: any) => void>> = new Map();
  private initialized = false;

  async inicializar(): Promise<void> {
    if (this.initialized) return;
    
    console.log('Inicializando servicio PubSub en memoria');
    this.initialized = true;
  }

  async publicar<T>(topic: string, mensaje: T): Promise<void> {
    if (!this.initialized) await this.inicializar();
    
    console.log(`Publicando mensaje en el topic: ${topic}`, mensaje);
    
    const topicSubscriptions = this.subscriptions.get(topic);
    
    if (topicSubscriptions) {
      // Notificar a todos los suscriptores del topic
      topicSubscriptions.forEach(callback => {
        try {
          callback(mensaje);
        } catch (error) {
          console.error(`Error al enviar mensaje a suscriptor en topic ${topic}:`, error);
        }
      });
    }
  }

  async suscribir<T>(topic: string, callback: (mensaje: T) => void): Promise<string> {
    if (!this.initialized) await this.inicializar();
    
    const subscriptionId = uuidv4();
    
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Map());
    }
    
    const topicSubscriptions = this.subscriptions.get(topic)!;
    topicSubscriptions.set(subscriptionId, callback as any);
    
    console.log(`Nueva suscripción (${subscriptionId}) al topic: ${topic}`);
    
    return subscriptionId;
  }

  async cancelarSuscripcion(subscriptionId: string): Promise<void> {
    if (!this.initialized) await this.inicializar();
    
    for (const [topic, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.has(subscriptionId)) {
        subscriptions.delete(subscriptionId);
        console.log(`Suscripción cancelada (${subscriptionId}) del topic: ${topic}`);
        
        // Si no quedan suscripciones para este topic, limpiamos el topic
        if (subscriptions.size === 0) {
          this.subscriptions.delete(topic);
        }
        
        return;
      }
    }
    
    console.warn(`No se encontró la suscripción con ID: ${subscriptionId}`);
  }
} 
import { injectable } from 'inversify';
import { PubSub, Subscription, Topic, Message } from '@google-cloud/pubsub';
import { IPubSubService } from '../../application/interfaces/pubsub-service.interface';

/**
 * Implementación del servicio PubSub utilizando Google Cloud Pub/Sub
 * Usa un único tema con atributos para filtrar por tipo de mensaje
 * Soporta tanto el entorno de producción como el emulador local
 */
@injectable()
export class GoogleCloudPubSubService implements IPubSubService {
  private pubSubClient: PubSub;
  private mainTopic!: Topic; // Using definite assignment assertion
  private subscriptions: Map<string, { subscription: Subscription, callback: Function }> = new Map();
  private initialized = false;
  private readonly identificadorId: string;
  private readonly MAIN_TOPIC: string;
  private readonly SUBSCRIPTION_PREFIX: string;
  private readonly isEmulator: boolean;
  
  constructor() {
    // Determinar si estamos usando el emulador
    this.isEmulator = !!process.env.PUBSUB_EMULATOR_HOST;
    
    // Configuración del cliente PubSub
    const pubsubOptions: any = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    };
    
    // Si estamos usando el emulador, configurar el endpoint
    if (this.isEmulator) {
      pubsubOptions.apiEndpoint = process.env.PUBSUB_EMULATOR_HOST;
      console.log(`Usando emulador PubSub en: ${process.env.PUBSUB_EMULATOR_HOST}`);
    }
    
    this.pubSubClient = new PubSub(pubsubOptions);
    this.identificadorId = process.env.USER_ID || 'default-user';
    this.MAIN_TOPIC = 'juan-gil-rutas-events';
    this.SUBSCRIPTION_PREFIX = 'rutas-events';
    
    console.log(`Servicio PubSub inicializado para identificador: ${this.identificadorId}`);
    console.log(`Modo: ${this.isEmulator ? 'Emulador Local' : 'Google Cloud PubSub'}`);
  }
  
  /**
   * Inicializa el servicio PubSub y crea el tema principal si no existe
   */
  async inicializar(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Crear el tema principal si no existe
      const [topics] = await this.pubSubClient.getTopics();
      const topicExists = topics.some(topic => 
        topic.name.includes(`/${this.MAIN_TOPIC}`)
      );
      
      if (!topicExists) {
        console.log(`Creando tema principal ${this.MAIN_TOPIC}...`);
        [this.mainTopic] = await this.pubSubClient.createTopic(this.MAIN_TOPIC);
      } else {
        this.mainTopic = this.pubSubClient.topic(this.MAIN_TOPIC);
      }
      
      console.log(`Tema principal ${this.MAIN_TOPIC} inicializado correctamente`);
      this.initialized = true;
    } catch (error) {
      console.error('Error al inicializar servicio PubSub:', error);
      throw error;
    }
  }
  
  /**
   * Publica un mensaje en el tipo de mensaje específico
   * @param tipoMensaje Tipo de mensaje (usado como atributo)
   * @param datos Datos a publicar
   */
  async publicar<T>(tipoMensaje: string, datos: T): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Codificar el mensaje en JSON
      const messageBuffer = Buffer.from(JSON.stringify(datos));
      
      // Agregar atributos para filtrado
      const attributes = {
        messageType: tipoMensaje,
        userId: this.identificadorId,
        timestamp: new Date().toISOString()
      };
      
      // Publicar en el tema principal
      const messageId = await this.mainTopic.publish(messageBuffer, attributes);
      console.log(`Mensaje publicado, ID: ${messageId}, tipo: ${tipoMensaje}`);
    } catch (error) {
      console.error(`Error al publicar mensaje de tipo ${tipoMensaje}:`, error);
      throw error;
    }
  }
  
  /**
   * Suscribe un callback para recibir mensajes de un tipo específico
   * @param tipoMensaje Tipo de mensaje al que suscribirse
   * @param callback Función a ejecutar cuando se reciba un mensaje
   * @param subscriptionId ID de suscripción opcional, o se generará uno automáticamente
   * @returns El ID de suscripción creado
   */
  async suscribir<T>(
    tipoMensaje: string, 
    callback: (mensaje: T) => Promise<void>,
    subscriptionId?: string
  ): Promise<string> {
    await this.ensureInitialized();
    
    try {
      // Crear un ID para la suscripción siguiendo el formato solicitado: rutas-events-tipo
      const subId = subscriptionId || `${this.SUBSCRIPTION_PREFIX}-${tipoMensaje}`;
      
      // Verificar si ya existe la suscripción
      const subscriptionExists = this.subscriptions.has(subId);
      if (subscriptionExists) {
        console.log(`Reutilizando suscripción existente: ${subId}`);
        return subId;
      }
      
      // Crear la suscripción con filtro por tipo de mensaje
      const options = {
        filter: `attributes.messageType = "${tipoMensaje}"`,
        expirationPolicy: {
          ttl: {
            seconds: 24 * 60 * 60 // Expira en 24 horas si no se procesa
          }
        }
      };
      
      const [subscription] = await this.mainTopic.createSubscription(subId, options);
      console.log(`Creada suscripción para ${tipoMensaje}: ${subId}`);
      
      // Configurar el procesamiento de mensajes
      const messageHandler = async (message: Message) => {
        try {
          // Asegurarse de que es el tipo correcto
          if (message.attributes.messageType !== tipoMensaje) {
            message.ack();
            return;
          }
          
          console.log(`Recibido mensaje, ID: ${message.id}, tipo: ${tipoMensaje}`);
          
          // Parsear datos
          const data = JSON.parse(message.data.toString());
          
          // Ejecutar callback
          await callback(data);
          
          // Confirmar procesamiento
          message.ack();
        } catch (error) {
          console.error(`Error procesando mensaje de tipo ${tipoMensaje}:`, error);
          // No confirmar para que se reintente (según política de reintentos)
          message.nack();
        }
      };
      
      // Iniciar procesamiento de mensajes
      subscription.on('message', messageHandler);
      
      // Guardar referencia para poder cancelar después
      this.subscriptions.set(subId, { subscription, callback: messageHandler });
      
      return subId;
    } catch (error) {
      console.error(`Error al suscribirse al tipo ${tipoMensaje}:`, error);
      throw error;
    }
  }
  
  /**
   * Cancela una suscripción existente
   * @param subscriptionId ID de la suscripción a cancelar
   */
  async cancelarSuscripcion(subscriptionId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        await subscription.subscription.delete();
        this.subscriptions.delete(subscriptionId);
        console.log(`Suscripción ${subscriptionId} cancelada`);
      } else {
        console.warn(`Intento de cancelar suscripción inexistente: ${subscriptionId}`);
      }
    } catch (error) {
      console.error(`Error al cancelar suscripción ${subscriptionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Asegura que el servicio esté inicializado antes de usarlo
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.inicializar();
    }
  }
} 
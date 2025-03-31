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
    
    // Crear un ID para la suscripción siguiendo el formato solicitado
    const subId = subscriptionId || `${this.SUBSCRIPTION_PREFIX}-${tipoMensaje}-${Date.now()}`;
    
    // Verificar si ya existe la suscripción localmente
    const subscriptionInMemory = this.subscriptions.has(subId);
    if (subscriptionInMemory) {
      console.log(`Reutilizando suscripción existente en memoria: ${subId}`);
      return subId;
    }
    
    try {
      // Crear un filtro para recibir solo mensajes del tipo especificado
      const filter = `attributes.messageType = "${tipoMensaje}"`;
      console.log(`Creando suscripción ${subId} con filtro: ${filter}`);
      
      // Verificar si ya existe la suscripción en GCP
      let subscription: Subscription;
      const formattedSubscriptionId = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/subscriptions/${subId}`;
      try {
        const [subscriptions] = await this.pubSubClient.getSubscriptions();
        const existingSubscription = subscriptions.find(s => s.name === formattedSubscriptionId);
        
        if (existingSubscription) {
          console.log(`Reutilizando suscripción existente en GCP: ${subId}`);
          subscription = this.pubSubClient.subscription(subId);
          
          // Limpiamos los listeners existentes para evitar duplicidad
          subscription.removeAllListeners();
        } else {
          // Crear una nueva suscripción
          [subscription] = await this.mainTopic.createSubscription(subId, {
            filter,
            expirationPolicy: { ttl: { seconds: 3600 } }, // 1 hora de expiración
            messageRetentionDuration: { seconds: 600 }, // 10 minutos de retención
            ackDeadlineSeconds: 60 // 1 minuto para procesar
          });
          console.log(`Suscripción ${subId} creada exitosamente`);
        }
      } catch (error) {
        console.warn(`Error al verificar/crear suscripción ${subId}, intentando crear directamente:`, error);
        
        // Intentar crear directamente si falló la verificación
        [subscription] = await this.mainTopic.createSubscription(subId, {
          filter,
          expirationPolicy: { ttl: { seconds: 3600 } }, // 1 hora de expiración
          messageRetentionDuration: { seconds: 600 }, // 10 minutos de retención
          ackDeadlineSeconds: 60 // 1 minuto para procesar
        });
        console.log(`Suscripción ${subId} creada directamente`);
      }
      
      // Configurar el manejo de mensajes
      const messageHandler = async (message: Message) => {
        try {
          console.log(`Recibido mensaje en suscripción ${subId}:`, {
            id: message.id,
            attributes: message.attributes,
            orderingKey: message.orderingKey
          });
          
          // Deserializar los datos
          const data = JSON.parse(message.data.toString());
          
          // Ejecutar el callback con los datos
          await callback(data);
          
          // Confirmar procesamiento exitoso
          message.ack();
        } catch (error) {
          console.error(`Error procesando mensaje en suscripción ${subId}:`, error);
          // Nack el mensaje para que sea reintentado
          message.nack();
        }
      };
      
      // Configurar manejo de errores
      const errorHandler = (error: Error) => {
        console.error(`Error en suscripción ${subId}:`, error);
      };
      
      // Registrar handlers
      subscription.on('message', messageHandler);
      subscription.on('error', errorHandler);
      
      // Guardar la suscripción en memoria
      this.subscriptions.set(subId, {
        subscription,
        callback: messageHandler
      });
      
      console.log(`Creada suscripción para ${tipoMensaje}: ${subId}`);
      return subId;
    } catch (error) {
      console.error(`Error al suscribirse a mensajes de tipo ${tipoMensaje}:`, error);
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
        // Eliminamos de la colección local primero
        this.subscriptions.delete(subscriptionId);
        
        try {
          // Solo intentamos eliminar si existe localmente
          const subscriptionExists = await subscription.subscription.exists();
          if (subscriptionExists[0]) {
            await subscription.subscription.delete();
            console.log(`Suscripción ${subscriptionId} cancelada`);
          } else {
            console.log(`La suscripción ${subscriptionId} ya no existe en GCP`);
          }
        } catch (error) {
          // Si ocurre un error, lo registramos pero no lo propagamos
          console.warn(`Error al eliminar suscripción ${subscriptionId} en GCP, continuando:`, error);
        }
      } else {
        console.log(`La suscripción ${subscriptionId} no se encuentra en memoria, verificando en GCP...`);
        
        try {
          // Verificar si existe en GCP aunque no esté en memoria
          const gcloudSubscription = this.pubSubClient.subscription(subscriptionId);
          const [exists] = await gcloudSubscription.exists();
          
          if (exists) {
            await gcloudSubscription.delete();
            console.log(`Suscripción ${subscriptionId} que no estaba en memoria fue cancelada en GCP`);
          } else {
            console.log(`No se encontró la suscripción ${subscriptionId} en GCP ni en memoria`);
          }
        } catch (error) {
          console.warn(`Error al verificar/eliminar suscripción ${subscriptionId}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error al cancelar suscripción ${subscriptionId}:`, error);
      // No propagamos el error para evitar fallos en cascada
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
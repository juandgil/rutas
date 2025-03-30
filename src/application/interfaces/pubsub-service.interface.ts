/**
 * Interfaz para el servicio de PubSub
 * Encapsula la funcionalidad de comunicación asíncrona entre componentes
 */
export interface IPubSubService {
  /**
   * Inicializa el servicio PubSub
   */
  inicializar(): Promise<void>;
  
  /**
   * Publica un mensaje en un tipo de mensaje específico
   * @param tipoMensaje Tipo de mensaje a publicar
   * @param datos Datos a publicar
   */
  publicar<T>(tipoMensaje: string, datos: T): Promise<void>;
  
  /**
   * Suscribe a un callback para recibir mensajes de un tipo específico
   * @param tipoMensaje Tipo de mensaje al que suscribirse
   * @param callback Función a ejecutar cuando se reciba un mensaje
   * @param subscriptionId ID opcional para la suscripción, útil para cancelar después
   * @returns ID de la suscripción creada
   */
  suscribir<T>(
    tipoMensaje: string, 
    callback: (mensaje: T) => Promise<void>,
    subscriptionId?: string
  ): Promise<string>;
  
  /**
   * Cancela una suscripción existente
   * @param subscriptionId ID de la suscripción a cancelar
   */
  cancelarSuscripcion(subscriptionId: string): Promise<void>;
}
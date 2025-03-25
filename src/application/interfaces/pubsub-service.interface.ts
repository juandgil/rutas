export interface IPubSubService {
  publicar<T>(topic: string, mensaje: T): Promise<void>;
  suscribir<T>(topic: string, callback: (mensaje: T) => void): Promise<string>;
  cancelarSuscripcion(subscriptionId: string): Promise<void>;
}
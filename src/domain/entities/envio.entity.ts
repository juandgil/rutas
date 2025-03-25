/**
 * Representa un envío a entregar
 */
export class Envio {
  id: string;
  guia: string;
  direccionOrigen: string;
  direccionDestino: string;
  latitudDestino: number;
  longitudDestino: number;
  ciudadId: string;
  peso: number; // en kg
  volumen: number; // en m³
  estado: EstadoEnvio;
  slaId: string; // ID del SLA asociado a este envío
  equipoId: string | null; // ID del equipo asignado (puede ser null si aún no se ha asignado)
  ordenEntrega: number | null; // Orden de entrega dentro de la ruta (puede ser null si aún no tiene ruta)
  fechaEntregaEstimada: Date | null;
  fechaEntregaReal: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Envio>) {
    this.id = data.id || '';
    this.guia = data.guia || '';
    this.direccionOrigen = data.direccionOrigen || '';
    this.direccionDestino = data.direccionDestino || '';
    this.latitudDestino = data.latitudDestino || 0;
    this.longitudDestino = data.longitudDestino || 0;
    this.ciudadId = data.ciudadId || '';
    this.peso = data.peso || 0;
    this.volumen = data.volumen || 0;
    this.estado = data.estado || EstadoEnvio.PENDIENTE;
    this.slaId = data.slaId || '';
    this.equipoId = data.equipoId || null;
    this.ordenEntrega = data.ordenEntrega || null;
    this.fechaEntregaEstimada = data.fechaEntregaEstimada || null;
    this.fechaEntregaReal = data.fechaEntregaReal || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

export enum EstadoEnvio {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_RUTA = 'EN_RUTA',
  ENTREGADO = 'ENTREGADO',
  FALLIDO = 'FALLIDO',
  CANCELADO = 'CANCELADO'
} 
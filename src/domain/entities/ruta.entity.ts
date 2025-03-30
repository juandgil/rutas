/**
 * Representa una ruta optimizada para un equipo de entrega
 */
export class Ruta {
  id: string;
  equipoId: string;
  fecha: Date;
  envios: string[]; // IDs de los envíos asignados a esta ruta
  estado: EstadoRuta;
  distanciaTotal: number; // en km
  tiempoEstimado: number; // en minutos
  replanificada: boolean;
  ultimoEventoId: string | null; // ID del último evento que causó una replanificación
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Ruta>) {
    this.id = data.id ?? '';
    this.equipoId = data.equipoId ?? '';
    this.fecha = data.fecha ?? new Date();
    this.envios = data.envios ?? [];
    this.estado = data.estado ?? EstadoRuta.PLANIFICADA;
    this.distanciaTotal = data.distanciaTotal ?? 0;
    this.tiempoEstimado = data.tiempoEstimado ?? 0;
    this.replanificada = data.replanificada ?? false;
    this.ultimoEventoId = data.ultimoEventoId ?? null;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }
}

export enum EstadoRuta {
  PLANIFICADA = 'PLANIFICADA',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
} 
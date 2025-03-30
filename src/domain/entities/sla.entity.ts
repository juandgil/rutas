/**
 * Representa un acuerdo de nivel de servicio (SLA) para las entregas
 */
export class Sla {
  id: string;
  nombre: string;
  descripcion: string;
  tiempoEntrega: number; // en horas
  prioridad: number; // 1 es la más alta, 10 la más baja
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Sla>) {
    this.id = data.id ?? '';
    this.nombre = data.nombre ?? '';
    this.descripcion = data.descripcion ?? '';
    this.tiempoEntrega = data.tiempoEntrega ?? 24; // Por defecto, 24 horas
    this.prioridad = data.prioridad ?? 5; // Prioridad media por defecto
    this.activo = data.activo ?? true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
} 
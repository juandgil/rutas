/**
 * Representa un equipo de entrega compuesto por transportistas y un vehículo
 */
export class Equipo {
  id: string;
  nombre: string;
  transportistas: string[]; // IDs de los transportistas asignados al equipo
  vehiculoId: string;
  disponible: boolean;
  ciudadId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Equipo>) {
    this.id = data.id || '';
    this.nombre = data.nombre || '';
    this.transportistas = data.transportistas || [];
    this.vehiculoId = data.vehiculoId || '';
    this.disponible = data.disponible !== undefined ? data.disponible : true;
    this.ciudadId = data.ciudadId || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
} 
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
  latitud: number; // Ubicación geográfica - latitud
  longitud: number; // Ubicación geográfica - longitud
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Equipo>) {
    this.id = data.id ?? '';
    this.nombre = data.nombre ?? '';
    this.transportistas = data.transportistas ?? [];
    this.vehiculoId = data.vehiculoId ?? '';
    this.disponible = data.disponible ?? true;
    this.ciudadId = data.ciudadId ?? '';
    this.latitud = data.latitud ?? 0;
    this.longitud = data.longitud ?? 0;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }
} 
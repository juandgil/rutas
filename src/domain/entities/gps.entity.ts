/**
 * Representa un registro de ubicación GPS de un equipo
 */
export class Gps {
  id: string;
  equipoId: string;
  latitud: number;
  longitud: number;
  velocidad: number; // en km/h
  timestamp: Date;
  createdAt: Date;

  constructor(data: Partial<Gps>) {
    this.id = data.id ?? '';
    this.equipoId = data.equipoId ?? '';
    this.latitud = data.latitud ?? 0;
    this.longitud = data.longitud ?? 0;
    this.velocidad = data.velocidad ?? 0;
    this.timestamp = data.timestamp ?? new Date();
    this.createdAt = data.createdAt ?? new Date();
  }
} 
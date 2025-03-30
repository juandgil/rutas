/**
 * Representa un vehículo utilizado para las entregas
 */
export class Vehiculo {
  id: string;
  placa: string;
  modelo: string;
  tipo: TipoVehiculo;
  capacidadPeso: number; // en kg
  capacidadVolumen: number; // en m³
  disponible: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Vehiculo>) {
    this.id = data.id ?? '';
    this.placa = data.placa ?? '';
    this.modelo = data.modelo ?? '';
    this.tipo = data.tipo ?? TipoVehiculo.CAMIONETA;
    this.capacidadPeso = data.capacidadPeso ?? 0;
    this.capacidadVolumen = data.capacidadVolumen ?? 0;
    this.disponible = data.disponible ?? true;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }
}

export enum TipoVehiculo {
  CAMION = 'CAMION',
  CAMIONETA = 'CAMIONETA',
  FURGON = 'FURGON',
  MOTOCICLETA = 'MOTOCICLETA'
} 
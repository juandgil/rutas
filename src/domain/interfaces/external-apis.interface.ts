/**
 * Interfaces para las APIs externas simuladas
 */

// GPS de transportistas
export interface IGpsApi {
  obtenerUbicacion(equipoId: string): Promise<GpsUbicacion>;
  obtenerHistorico(equipoId: string, desde: Date, hasta: Date): Promise<GpsUbicacion[]>;
  registrarUbicacion(ubicacion: GpsUbicacion): Promise<GpsUbicacion>;
}

export interface GpsUbicacion {
  equipoId: string;
  latitud: number;
  longitud: number;
  velocidad: number;
  timestamp: Date;
}

// Tráfico y clima
export interface ITraficoClimaApi {
  obtenerCondicionesTrafico(ciudadId: string): Promise<CondicionTrafico>;
  obtenerCondicionesClima(ciudadId: string): Promise<CondicionClima>;
  obtenerImpactoRuta(origen: Coordenadas, destino: Coordenadas): Promise<ImpactoRuta>;
}

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface CondicionTrafico {
  ciudadId: string;
  nivel: NivelTrafico;
  descripcion: string;
  timestamp: Date;
}

export enum NivelTrafico {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CONGESTIONADO = 'CONGESTIONADO'
}

export interface CondicionClima {
  ciudadId: string;
  estado: EstadoClima;
  temperatura: number;
  lluvia: number; // en mm
  viento: number; // en km/h
  visibilidad: number; // en km
  descripcion: string; // Descripción textual de las condiciones climáticas
  timestamp: Date;
}

export enum EstadoClima {
  DESPEJADO = 'DESPEJADO',
  NUBLADO = 'NUBLADO',
  LLUVIOSO = 'LLUVIOSO',
  TORMENTA = 'TORMENTA'
}

export interface ImpactoRuta {
  tiempoAdicional: number; // en minutos
  distanciaAdicional: number; // en km
  nivelImpacto: NivelImpacto;
}

export enum NivelImpacto {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO'
}

// Información de vehículos
export interface IVehiculoApi {
  obtenerCapacidad(vehiculoId: string): Promise<CapacidadVehiculo>;
  verificarDisponibilidad(vehiculoId: string): Promise<DisponibilidadVehiculo>;
}

export interface CapacidadVehiculo {
  vehiculoId: string;
  pesoMaximo: number; // en kg
  volumenMaximo: number; // en m³
  tipo: TipoVehiculo;
}

export enum TipoVehiculo {
  CAMION = 'CAMION',
  FURGON = 'FURGON',
  CAMIONETA = 'CAMIONETA',
  MOTOCICLETA = 'MOTOCICLETA'
}

export interface DisponibilidadVehiculo {
  vehiculoId: string;
  disponible: boolean;
  razon?: string;
  fechaDisponibilidad?: Date;
} 
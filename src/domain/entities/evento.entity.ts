/**
 * Representa un evento inesperado que podría afectar a una ruta
 */
export class Evento {
  id: string;
  equipoId: string; // Equipo que reporta el evento
  tipo: TipoEvento;
  descripcion: string;
  latitud: number;
  longitud: number;
  ciudadId: string;
  impacto: NivelImpacto;
  fecha: Date;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Evento>) {
    this.id = data.id || '';
    this.equipoId = data.equipoId || '';
    this.tipo = data.tipo || TipoEvento.TRAFICO;
    this.descripcion = data.descripcion || '';
    this.latitud = data.latitud || 0;
    this.longitud = data.longitud || 0;
    this.ciudadId = data.ciudadId || '';
    this.impacto = data.impacto || NivelImpacto.MEDIO;
    this.fecha = data.fecha || new Date();
    this.activo = data.activo !== undefined ? data.activo : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

export enum TipoEvento {
  TRAFICO = 'TRAFICO',
  CLIMA = 'CLIMA',
  ACCIDENTE = 'ACCIDENTE',
  CIERRE_VIA = 'CIERRE_VIA',
  MANIFESTACION = 'MANIFESTACION',
  OTRO = 'OTRO'
}

export enum NivelImpacto {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO'
} 
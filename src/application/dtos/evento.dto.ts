import * as yup from 'yup';
import { TipoEvento, NivelImpacto } from '../../domain/entities/evento.entity';

export class CrearEventoDto {
  equipoId: string;
  tipo: TipoEvento;
  descripcion: string;
  latitud: number;
  longitud: number;
  ciudadId: string;
  impacto: NivelImpacto;

  constructor(data: Partial<CrearEventoDto>) {
    this.equipoId = data.equipoId || '';
    this.tipo = data.tipo || TipoEvento.TRAFICO;
    this.descripcion = data.descripcion || '';
    this.latitud = data.latitud || 0;
    this.longitud = data.longitud || 0;
    this.ciudadId = data.ciudadId || '';
    this.impacto = data.impacto || NivelImpacto.MEDIO;
  }

  static validationSchema = yup.object().shape({
    equipoId: yup.string().required('El ID del equipo es requerido'),
    tipo: yup.string().oneOf(Object.values(TipoEvento), 'Tipo de evento no válido'),
    descripcion: yup.string().required('La descripción es requerida'),
    latitud: yup.number().required('La latitud es requerida'),
    longitud: yup.number().required('La longitud es requerida'),
    ciudadId: yup.string().required('El ID de la ciudad es requerido'),
    impacto: yup.string().oneOf(Object.values(NivelImpacto), 'Nivel de impacto no válido')
  });
}

export class EventoResponseDto {
  id: string;
  equipoId: string;
  tipo: TipoEvento;
  descripcion: string;
  latitud: number;
  longitud: number;
  ciudadId: string;
  impacto: NivelImpacto;
  fecha: Date;
  activo: boolean;

  constructor(data: Partial<EventoResponseDto>) {
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
  }
} 
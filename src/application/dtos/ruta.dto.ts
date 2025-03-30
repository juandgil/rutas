import * as yup from 'yup';
import { EstadoRuta } from '../../domain/entities/ruta.entity';

export class OptimizarRutaRequestDto {
  equipoId: string;
  fecha?: Date;

  constructor(data: Partial<OptimizarRutaRequestDto>) {
    this.equipoId = data.equipoId ?? '';
    this.fecha = data.fecha || new Date();
  }

  static validationSchema = yup.object().shape({
    equipoId: yup.string().required('El ID del equipo es requerido'),
    fecha: yup.date()
  });
}

export class ReplanificarRutaRequestDto {
  equipoId: string;
  eventoId: string;

  constructor(data: Partial<ReplanificarRutaRequestDto>) {
    this.equipoId = data.equipoId ?? '';
    this.eventoId = data.eventoId ?? '';
  }

  static validationSchema = yup.object().shape({
    equipoId: yup.string().required('El ID del equipo es requerido'),
    eventoId: yup.string().required('El ID del evento es requerido')
  });
}

export class RutaResponseDto {
  id: string;
  equipoId: string;
  fecha: Date;
  envios: EnvioRutaDto[];
  estado: EstadoRuta;
  distanciaTotal: number;
  tiempoEstimado: number;
  replanificada: boolean;
  ultimoEventoId: string | null;

  constructor(data: Partial<RutaResponseDto>) {
    this.id = data.id ?? '';
    this.equipoId = data.equipoId ?? '';
    this.fecha = data.fecha || new Date();
    this.envios = data.envios ?? [];
    this.estado = data.estado ?? EstadoRuta.PLANIFICADA;
    this.distanciaTotal = data.distanciaTotal ?? 0;
    this.tiempoEstimado = data.tiempoEstimado ?? 0;
    this.replanificada = data.replanificada !== undefined ? data.replanificada : false;
    this.ultimoEventoId = data.ultimoEventoId ?? null;
  }
}

export class EnvioRutaDto {
  id: string;
  guia: string;
  direccionDestino: string;
  latitudDestino: number;
  longitudDestino: number;
  ordenEntrega: number;
  slaId: string;
  prioridadSla: number;

  constructor(data: Partial<EnvioRutaDto>) {
    this.id = data.id ?? '';
    this.guia = data.guia ?? '';
    this.direccionDestino = data.direccionDestino ?? '';
    this.latitudDestino = data.latitudDestino ?? 0;
    this.longitudDestino = data.longitudDestino ?? 0;
    this.ordenEntrega = data.ordenEntrega ?? 0;
    this.slaId = data.slaId ?? '';
    this.prioridadSla = data.prioridadSla ?? 5;
  }
} 
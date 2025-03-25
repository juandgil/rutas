import { Evento, TipoEvento } from '../entities/evento.entity';
import { IBaseRepository } from './base.repository';

export interface IEventoRepository extends IBaseRepository<Evento, string> {
  findByEquipo(equipoId: string): Promise<Evento[]>;
  findByCiudad(ciudadId: string): Promise<Evento[]>;
  findByTipo(tipo: TipoEvento): Promise<Evento[]>;
  findActivos(): Promise<Evento[]>;
  findByFecha(fecha: Date): Promise<Evento[]>;
  marcarInactivo(id: string): Promise<Evento>;
} 
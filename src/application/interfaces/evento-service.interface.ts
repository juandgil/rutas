import { Evento } from '../../domain/entities/evento.entity';

export interface IEventoService {
  registrarEvento(evento: Partial<Evento>): Promise<Evento>;
  obtenerEventosActivos(): Promise<Evento[]>;
  obtenerEventosPorCiudad(ciudadId: string): Promise<Evento[]>;
  obtenerEventosPorEquipo(equipoId: string): Promise<Evento[]>;
  marcarInactivo(id: string): Promise<Evento>;
} 
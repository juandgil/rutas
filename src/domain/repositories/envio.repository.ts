import { Envio, EstadoEnvio } from '../entities/envio.entity';
import { IBaseRepository } from './base.repository';

export interface IEnvioRepository extends IBaseRepository<Envio, string> {
  findByGuia(guia: string): Promise<Envio | null>;
  findByEquipo(equipoId: string): Promise<Envio[]>;
  findByEstado(estado: EstadoEnvio): Promise<Envio[]>;
  findBySla(slaId: string): Promise<Envio[]>;
  findByCiudad(ciudadId: string): Promise<Envio[]>;
  findPendientesByEquipo(equipoId: string): Promise<Envio[]>;
  actualizarEstado(id: string, estado: EstadoEnvio): Promise<Envio>;
  actualizarOrdenEntrega(id: string, ordenEntrega: number): Promise<Envio>;
  asignarAEquipo(id: string, equipoId: string): Promise<Envio>;
} 
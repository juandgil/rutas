/**
 * Interfaz base para todos los repositorios
 * T representa el tipo de entidad con la que trabaja el repositorio
 * ID representa el tipo del identificador de la entidad
 */
export interface IBaseRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
} 
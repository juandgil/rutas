import { Container } from 'inversify';
import { TYPES } from './types';

// Crear el contenedor IoC
const container = new Container();

// Configuraciones
// Aquí se registrarán todas las dependencias (repositories, services, etc.)

export { container }; 
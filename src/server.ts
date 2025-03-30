/**
 * Punto de entrada principal de la aplicación
 */
import 'reflect-metadata'; // Necesario para inversify
import { App } from './infrastructure/express/app';
import config from './infrastructure/config/config';

// Crear y iniciar la aplicación
const app = new App();
const port = config.PORT;

// Iniciar el servidor
app.inicializar().then(() => {
  app.escuchar(port, () => {
    console.log(`Servidor iniciado en el puerto ${port}`);
  });
}).catch(error => {
  console.error('Error al inicializar la aplicación:', error);
  process.exit(1);
});

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
}); 
// Este archivo sirve como índice para los schemas de Swagger
// Las anotaciones JSDoc en los archivos son procesadas automáticamente por swagger-jsdoc
// No es necesario exportar nada desde aquí, solo asegurarse de que los archivos estén incluidos

// Importar definiciones de schemas
import './auth.schema';
import './common.schema';
import './eventos.schema';
import './gps.schema';
import './rutas.schema';
import './vehiculos.schema';
import './api-externas.schema';
import './tags.schema';

// Importar definiciones de rutas
import './auth.routes';
import './eventos.routes';
import './gps.routes';
import './rutas.routes';
import './vehiculos.routes';
import './api-externas.routes';
import './admin.routes';

// Esto facilita la importación en otros lugares si es necesario
export default {
  // No hay exportaciones reales, solo importaciones
}; 
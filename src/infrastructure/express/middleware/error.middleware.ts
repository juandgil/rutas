import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global para manejar errores en la aplicación
 * Captura cualquier error no manejado y devuelve una respuesta JSON estructurada
 */
export const errorMiddleware = (
  err: Error, 
  req: Request, 
  res: Response,
  next: NextFunction
): void => {
  console.error('Error no manejado en la aplicación:', err);
  
  // Determinar el código de estado (por defecto 500)
  const statusCode = (err as any).statusCode || 500;
  
  // Preparar la respuesta
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: {
      name: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
}; 
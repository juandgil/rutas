import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../../config/config';

/**
 * Middleware para verificar la autenticación de los usuarios
 * Todos los endpoints protegidos deben usar este middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obtener el token de la cabecera de autorización
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Se requiere token de autenticación.',
        data: null
      });
      return;
    }
    
    // Extraer el token sin el prefijo 'Bearer '
    const token = authHeader.slice(7);
    
    // Verificar el token
    const decodedToken = jwt.verify(token, config.JWT_SECRET);
    
    // Agregar la información del usuario al request para uso posterior
    (req as any).usuario = decodedToken;
    
    // Continuar con la siguiente función en la cadena
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      data: null
    });
  }
}; 
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../../infrastructure/config/config';
import { interfaces } from 'inversify-express-utils';

export interface IDecodedToken {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware para uso directo con Express
export const authMiddlewareExpress = (requiredRoles?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, config.JWT_SECRET) as IDecodedToken;
      
      // Agregar el usuario decodificado a la solicitud
      (req as any).user = decoded;
      
      // Verificar los roles si es necesario
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(decoded.role)) {
          return res.status(403).json({ error: 'No tiene permiso para acceder a este recurso' });
        }
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
};

// Middleware para decorador compatible con inversify-express-utils
export function authMiddleware(requiredRoles?: string[]): interfaces.Middleware {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No se proporcionó token de autenticación' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, config.JWT_SECRET) as IDecodedToken;
      
      // Agregar el usuario decodificado a la solicitud
      (req as any).user = decoded;
      
      // Verificar los roles si es necesario
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(decoded.role)) {
          res.status(403).json({ error: 'No tiene permiso para acceder a este recurso' });
          return;
        }
      }
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido o expirado' });
      return;
    }
  };
} 
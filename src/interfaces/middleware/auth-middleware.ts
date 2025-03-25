import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../../infrastructure/config/config';

export interface IDecodedToken {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = (requiredRoles?: string[]) => {
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
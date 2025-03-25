import { injectable } from 'inversify';
import * as jwt from 'jsonwebtoken';
import { IAuthService } from '../interfaces/auth-service.interface';
import config from '../../infrastructure/config/config';
import { ICacheService } from '../../infrastructure/cache/redis-client';
import { TYPES } from '../../infrastructure/ioc/types';
import { inject } from 'inversify';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService
  ) {}

  async login(username: string, password: string): Promise<string> {
    // Para esta demo, simplemente validamos contra algunos usuarios hardcodeados
    // En una aplicación real, esto se haría contra una base de datos
    const validUsers = [
      { username: 'admin', password: 'admin123', role: 'ADMIN' },
      { username: 'operador', password: 'operador123', role: 'OPERADOR' },
      { username: 'transportista', password: 'transportista123', role: 'TRANSPORTISTA' }
    ];

    const user = validUsers.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token JWT
    return this.generateToken(username, user.role);
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // Verificar token en cache (token blacklist)
      const blacklisted = await this.cacheService.get(`blacklist:${token}`);
      if (blacklisted) {
        return false;
      }

      // Verificar token con JWT
      jwt.verify(token, config.JWT_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateToken(userId: string, role: string): Promise<string> {
    const payload = {
      sub: userId,
      role: role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };

    return jwt.sign(payload, config.JWT_SECRET);
  }
} 
export interface IAuthService {
  login(username: string, password: string): Promise<string>;
  validateToken(token: string): Promise<boolean>;
  generateToken(userId: string, role: string): Promise<string>;
} 
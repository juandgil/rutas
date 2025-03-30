import { Request, Response } from 'express';
import { controller, httpPost, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '../../infrastructure/ioc/types';
import { IAuthService } from '../../application/interfaces/auth-service.interface';
import { LoginRequestDto, LoginResponseDto } from '../../application/dtos/auth.dto';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para autenticación de usuarios, gestión de tokens JWT y control de acceso al sistema
 */
@controller('/auth')
export class AuthController {
  constructor(
    @inject(TYPES.IAuthService) private authService: IAuthService
  ) {}

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Autenticar usuario y obtener token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: Credenciales inválidas
   *       500:
   *         description: Error interno del servidor
   */
  @httpPost('/login')
  async login(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      // Validar datos de entrada
      const loginDto = new LoginRequestDto(req.body);
      
      try {
        await LoginRequestDto.validationSchema.validate(loginDto);
      } catch (validationError: any) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: validationError.message
        });
      }
      
      // Autenticar usuario
      const result = await this.authService.login(loginDto.username, loginDto.password);
      
      if (!result) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      // Crear respuesta
      const response = new LoginResponseDto({
        token: result,
        expiresIn: 86400 // 24 horas en segundos
      });
      
      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error en login:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
} 
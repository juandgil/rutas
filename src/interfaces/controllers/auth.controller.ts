import { Request, Response } from 'express';
import { controller, httpPost, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '../../infrastructure/ioc/types';
import { IAuthService } from '../../application/interfaces/auth-service.interface';
import { LoginRequestDto, LoginResponseDto } from '../../application/dtos/auth.dto';

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para autenticación y autorización de usuarios
 */
@controller('/api/auth')
export class AuthController {
  constructor(
    @inject(TYPES.IAuthService) private authService: IAuthService
  ) {}

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Autenticar usuario y obtener token
   *     tags: [Autenticación]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: Nombre de usuario
   *               password:
   *                 type: string
   *                 format: password
   *                 description: Contraseña del usuario
   *           example:
   *             username: "admin"
   *             password: "admin123"
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: JWT token
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     username:
   *                       type: string
   *                     role:
   *                       type: string
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
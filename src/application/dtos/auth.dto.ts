import * as yup from 'yup';

export class LoginRequestDto {
  username: string;
  password: string;

  constructor(data: Partial<LoginRequestDto>) {
    this.username = data.username || '';
    this.password = data.password || '';
  }

  static validationSchema = yup.object().shape({
    username: yup.string().required('El nombre de usuario es requerido'),
    password: yup.string().required('La contraseña es requerida')
  });
}

export class LoginResponseDto {
  token: string;
  expiresIn: number;

  constructor(data: Partial<LoginResponseDto>) {
    this.token = data.token || '';
    this.expiresIn = data.expiresIn || 86400; // 24 horas en segundos
  }
} 
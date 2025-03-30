/**
 * Respuesta estándar de la API
 * Esta clase proporciona una estructura uniforme para todas las respuestas de la API
 */
export class ApiResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T | null;

  constructor(success: boolean, message: string, data: T | null) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
} 
/**
 * Implementación del patrón Circuit Breaker para aumentar la resiliencia
 * de las llamadas a servicios externos.
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  /**
   * Crea una nueva instancia de Circuit Breaker
   * @param maxFailures Número máximo de fallos permitidos antes de abrir el circuito
   * @param resetTimeout Tiempo en ms después del cual intentar un half-open
   */
  constructor(
    private readonly maxFailures: number = Number(process.env.CIRCUIT_BREAKER_MAX_FAILURES || 5),
    private readonly resetTimeout: number = Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || 30000) // 30 segundos
  ) {}
  
  /**
   * Ejecuta una operación con protección de Circuit Breaker
   * @param operation Función de la operación principal a ejecutar
   * @param fallback Función alternativa si el circuito está abierto o la operación falla
   * @returns Resultado de la operación o del fallback
   */
  async execute<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Verificar si ha pasado el tiempo suficiente para reintentar
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        console.log('Circuit breaker cambiando de OPEN a HALF_OPEN');
        this.state = 'HALF_OPEN';
      } else {
        console.log('Circuit breaker OPEN, ejecutando fallback');
        return fallback();
      }
    }
    
    try {
      const result = await operation();
      
      // Si la operación fue exitosa y estamos en HALF_OPEN, restablecer el circuito
      if (this.state === 'HALF_OPEN') {
        console.log('Operación exitosa en HALF_OPEN, restableciendo circuito');
        this.reset();
      }
      
      return result;
    } catch (error) {
      // Registrar el fallo e incrementar el contador
      this.failures++;
      this.lastFailureTime = Date.now();
      
      console.error(`Fallo en Circuit Breaker: ${this.failures}/${this.maxFailures}`);
      
      // Si llegamos al número máximo de fallos, abrir el circuito
      if (this.failures >= this.maxFailures) {
        this.state = 'OPEN';
        console.log(`Circuit breaker abierto después de ${this.failures} fallos consecutivos`);
      }
      
      // Lanzar la excepción a nivel superior para mejor manejo de errores
      return fallback();
    }
  }
  
  /**
   * Restablece el estado del Circuit Breaker a cerrado
   */
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    console.log('Circuit breaker restablecido a estado CLOSED');
  }
  
  /**
   * Devuelve el estado actual del Circuit Breaker
   */
  getState(): string {
    return this.state;
  }
} 
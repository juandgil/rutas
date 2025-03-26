import { injectable } from 'inversify';
import { 
  IVehiculoApi, 
  CapacidadVehiculo, 
  DisponibilidadVehiculo, 
  TipoVehiculo 
} from '../../domain/interfaces/external-apis.interface';
import { ICacheService } from '../cache/redis-client';
import { inject } from 'inversify';
import { TYPES } from '../ioc/types';

/**
 * Implementación simulada de la API de información de vehículos
 */
@injectable()
export class VehiculoApiMock implements IVehiculoApi {
  private readonly CACHE_KEY_CAPACIDAD = 'vehiculo:capacidad:';
  private readonly CACHE_KEY_DISPONIBILIDAD = 'vehiculo:disponibilidad:';
  private readonly CACHE_TTL = 86400; // 24 horas en segundos (la capacidad no cambia frecuentemente)
  private readonly CACHE_TTL_DISPONIBILIDAD = 3600; // 1 hora en segundos

  // Datos simulados de vehículos
  private readonly vehiculosDatosMock: Record<string, {
    tipo: TipoVehiculo;
    pesoMaximo: number;
    volumenMaximo: number;
  }> = {
    'veh-001': { tipo: TipoVehiculo.FURGON, pesoMaximo: 1500, volumenMaximo: 12 },
    'veh-002': { tipo: TipoVehiculo.FURGON, pesoMaximo: 2000, volumenMaximo: 15 },
    'veh-003': { tipo: TipoVehiculo.CAMION, pesoMaximo: 4500, volumenMaximo: 30 },
    'veh-004': { tipo: TipoVehiculo.MOTOCICLETA, pesoMaximo: 20, volumenMaximo: 0.2 },
    // Valores por defecto para vehículos desconocidos
    'default-camion': { tipo: TipoVehiculo.CAMION, pesoMaximo: 3500, volumenMaximo: 25 },
    'default-furgon': { tipo: TipoVehiculo.FURGON, pesoMaximo: 1800, volumenMaximo: 14 },
    'default-camioneta': { tipo: TipoVehiculo.CAMIONETA, pesoMaximo: 800, volumenMaximo: 5 },
    'default-moto': { tipo: TipoVehiculo.MOTOCICLETA, pesoMaximo: 15, volumenMaximo: 0.15 }
  };

  constructor(
    @inject(TYPES.ICacheService) private cacheService: ICacheService
  ) {}

  async obtenerCapacidad(vehiculoId: string): Promise<CapacidadVehiculo> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_CAPACIDAD}${vehiculoId}`;
      const cachedData = await this.cacheService.get<CapacidadVehiculo>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Simular datos de capacidad si no están en caché
      const capacidadVehiculo = this.generarCapacidadVehiculo(vehiculoId);
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, capacidadVehiculo, this.CACHE_TTL);
      
      return capacidadVehiculo;
    } catch (error) {
      console.error('Error al obtener capacidad del vehículo:', error);
      // En caso de error, devolver capacidad por defecto
      return this.obtenerCapacidadPorDefecto(vehiculoId);
    }
  }

  async verificarDisponibilidad(vehiculoId: string): Promise<DisponibilidadVehiculo> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_DISPONIBILIDAD}${vehiculoId}`;
      const cachedData = await this.cacheService.get<DisponibilidadVehiculo>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Simular datos de disponibilidad si no están en caché
      const disponibilidad = this.generarDisponibilidadAleatoria(vehiculoId);
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, disponibilidad, this.CACHE_TTL_DISPONIBILIDAD);
      
      return disponibilidad;
    } catch (error) {
      console.error('Error al verificar disponibilidad del vehículo:', error);
      // En caso de error, asumir que está disponible
      return {
        vehiculoId,
        disponible: true
      };
    }
  }

  /**
   * Genera información de capacidad para un vehículo basada en datos preconfigurados o aleatorios
   */
  private generarCapacidadVehiculo(vehiculoId: string): CapacidadVehiculo {
    // Verificar si tenemos datos preconfigurados para este vehículo
    if (this.vehiculosDatosMock[vehiculoId]) {
      const datos = this.vehiculosDatosMock[vehiculoId];
      return {
        vehiculoId,
        pesoMaximo: datos.pesoMaximo,
        volumenMaximo: datos.volumenMaximo,
        tipo: datos.tipo
      };
    }
    
    // Para vehículos desconocidos, generar datos aleatorios basados en algún patrón del ID
    return this.obtenerCapacidadPorDefecto(vehiculoId);
  }

  /**
   * Obtiene capacidad por defecto para vehículos desconocidos
   */
  private obtenerCapacidadPorDefecto(vehiculoId: string): CapacidadVehiculo {
    // Determinar tipo de vehículo basado en el ID o asignar uno aleatorio
    let tipo: TipoVehiculo;
    let capacidadBase;
    
    if (vehiculoId.includes('camion')) {
      tipo = TipoVehiculo.CAMION;
      capacidadBase = this.vehiculosDatosMock['default-camion'];
    } else if (vehiculoId.includes('furgon')) {
      tipo = TipoVehiculo.FURGON;
      capacidadBase = this.vehiculosDatosMock['default-furgon'];
    } else if (vehiculoId.includes('camioneta')) {
      tipo = TipoVehiculo.CAMIONETA;
      capacidadBase = this.vehiculosDatosMock['default-camioneta'];
    } else if (vehiculoId.includes('moto')) {
      tipo = TipoVehiculo.MOTOCICLETA;
      capacidadBase = this.vehiculosDatosMock['default-moto'];
    } else {
      // Asignar tipo aleatorio
      const tipos = Object.values(TipoVehiculo);
      tipo = tipos[Math.floor(Math.random() * tipos.length)];
      
      const defaultKey = `default-${tipo.toLowerCase()}`;
      capacidadBase = this.vehiculosDatosMock[defaultKey] || this.vehiculosDatosMock['default-furgon'];
    }
    
    // Añadir algo de variación a los valores base
    const variacionPeso = (Math.random() * 0.2) - 0.1; // -10% a +10%
    const variacionVolumen = (Math.random() * 0.2) - 0.1; // -10% a +10%
    
    return {
      vehiculoId,
      tipo,
      pesoMaximo: Math.round(capacidadBase.pesoMaximo * (1 + variacionPeso)),
      volumenMaximo: Math.round(capacidadBase.volumenMaximo * (1 + variacionVolumen) * 10) / 10
    };
  }

  /**
   * Genera disponibilidad aleatoria para un vehículo
   */
  private generarDisponibilidadAleatoria(vehiculoId: string): DisponibilidadVehiculo {
    // Para simulación, asignar un 90% de probabilidad de disponibilidad
    const disponible = Math.random() < 0.9;
    
    // Si no está disponible, generar un motivo y una fecha de disponibilidad futura
    let razon: string | undefined;
    let fechaDisponibilidad: Date | undefined;
    
    if (!disponible) {
      const razonesNoDisponibilidad = [
        'En mantenimiento programado',
        'En reparación',
        'Fuera de servicio',
        'Asignado a otra ruta',
        'Indisponible por procedimientos administrativos'
      ];
      
      razon = razonesNoDisponibilidad[Math.floor(Math.random() * razonesNoDisponibilidad.length)];
      
      // Fecha de disponibilidad entre 1 y 24 horas en el futuro
      const horasAdicionales = 1 + Math.floor(Math.random() * 24);
      fechaDisponibilidad = new Date(Date.now() + horasAdicionales * 60 * 60 * 1000);
    }
    
    return {
      vehiculoId,
      disponible,
      razon,
      fechaDisponibilidad
    };
  }
} 
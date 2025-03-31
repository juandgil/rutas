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
import axios from 'axios';
import config from '../config/config';

/**
 * Implementación simulada de la API de información de vehículos
 * que ahora consume el endpoint HTTP
 */
@injectable()
export class VehiculoApiMock implements IVehiculoApi {
  private readonly CACHE_KEY_CAPACIDAD = 'vehiculo:capacidad:';
  private readonly CACHE_KEY_DISPONIBILIDAD = 'vehiculo:disponibilidad:';
  private readonly CACHE_TTL = 86400; // 24 horas en segundos (la capacidad no cambia frecuentemente)
  private readonly CACHE_TTL_DISPONIBILIDAD = 3600; // 1 hora en segundos
  private readonly API_BASE_URL = `http://localhost:${config.PORT || 3000}`;

  constructor(
    @inject(TYPES.ICacheService) private readonly cacheService: ICacheService
  ) {}

  async obtenerCapacidad(vehiculoId: string): Promise<CapacidadVehiculo> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_CAPACIDAD}${vehiculoId}`;
      const cachedData = await this.cacheService.get<CapacidadVehiculo>(cacheKey);
      
      if (cachedData) {
        console.log(`[VehiculoAPI] Capacidad obtenida de caché para vehículo ${vehiculoId}`);
        return cachedData;
      }
      
      // Consumir el endpoint que creamos para obtener los datos del vehículo
      console.log(`[VehiculoAPI] Consultando API para vehículo ${vehiculoId}`);
      const response = await axios.get(`${this.API_BASE_URL}/api/vehiculos/${vehiculoId}`);
      
      if (!response.data.success) {
        throw new Error(`Error al obtener información del vehículo: ${response.data.message}`);
      }
      
      const vehiculoInfo = response.data.data;
      
      // Mapear la respuesta al formato esperado
      const capacidadVehiculo: CapacidadVehiculo = {
        vehiculoId,
        tipo: this.mapearTipoVehiculo(vehiculoInfo.tipo),
        pesoMaximo: vehiculoInfo.capacidad.pesoMaximo,
        volumenMaximo: vehiculoInfo.capacidad.volumenMaximo
      };
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, capacidadVehiculo, this.CACHE_TTL);
      console.log(`[VehiculoAPI] Guardada capacidad en caché para vehículo ${vehiculoId}`);
      
      return capacidadVehiculo;
    } catch (error) {
      console.error(`[VehiculoAPI] Error al obtener capacidad del vehículo ${vehiculoId}:`, error);
      // En caso de error, devolver capacidad por defecto basada en el tipo inferido del ID
      const capacidadPorDefecto = this.obtenerCapacidadPorDefecto(vehiculoId);
      console.log(`[VehiculoAPI] Devolviendo capacidad por defecto para vehículo ${vehiculoId}:`, capacidadPorDefecto);
      return capacidadPorDefecto;
    }
  }

  async verificarDisponibilidad(vehiculoId: string): Promise<DisponibilidadVehiculo> {
    try {
      // Intentar obtener de caché
      const cacheKey = `${this.CACHE_KEY_DISPONIBILIDAD}${vehiculoId}`;
      const cachedData = await this.cacheService.get<DisponibilidadVehiculo>(cacheKey);
      
      if (cachedData) {
        console.log(`[VehiculoAPI] Disponibilidad obtenida de caché para vehículo ${vehiculoId}`);
        return cachedData;
      }
      
      // Consumir el endpoint para obtener los datos del vehículo
      console.log(`[VehiculoAPI] Consultando API para disponibilidad de vehículo ${vehiculoId}`);
      const response = await axios.get(`${this.API_BASE_URL}/api/vehiculos/${vehiculoId}`);
      
      if (!response.data.success) {
        throw new Error(`Error al obtener información del vehículo: ${response.data.message}`);
      }
      
      const vehiculoInfo = response.data.data;
      
      // Mapear la respuesta al formato esperado
      const disponibilidad: DisponibilidadVehiculo = {
        vehiculoId,
        disponible: vehiculoInfo.estado.disponible
      };
      
      // Guardar en caché
      await this.cacheService.set(cacheKey, disponibilidad, this.CACHE_TTL_DISPONIBILIDAD);
      console.log(`[VehiculoAPI] Guardada disponibilidad en caché para vehículo ${vehiculoId}`);
      
      return disponibilidad;
    } catch (error) {
      console.error(`[VehiculoAPI] Error al verificar disponibilidad del vehículo ${vehiculoId}:`, error);
      // En caso de error, asumir que está disponible
      console.log(`[VehiculoAPI] Asumiendo que el vehículo ${vehiculoId} está disponible (valor por defecto)`);
      return {
        vehiculoId,
        disponible: true
      };
    }
  }

  /**
   * Mapea las cadenas de tipo a los valores del enum TipoVehiculo
   */
  private mapearTipoVehiculo(tipo: string): TipoVehiculo {
    tipo = tipo.toUpperCase();
    switch (tipo) {
      case 'CAMION':
        return TipoVehiculo.CAMION;
      case 'FURGON':
        return TipoVehiculo.FURGON;
      case 'CAMIONETA':
        return TipoVehiculo.CAMIONETA;
      case 'MOTOCICLETA':
        return TipoVehiculo.MOTOCICLETA;
      default:
        console.warn(`[VehiculoAPI] Tipo de vehículo desconocido: ${tipo}, usando FURGON por defecto`);
        return TipoVehiculo.FURGON;
    }
  }

  /**
   * Obtiene capacidad por defecto para vehículos desconocidos
   */
  private obtenerCapacidadPorDefecto(vehiculoId: string): CapacidadVehiculo {
    // Valores por defecto según el tipo inferido del ID
    const vehiculosDatosMock: Record<string, {
      tipo: TipoVehiculo;
      pesoMaximo: number;
      volumenMaximo: number;
    }> = {
      'default-camion': { tipo: TipoVehiculo.CAMION, pesoMaximo: 3500, volumenMaximo: 25 },
      'default-furgon': { tipo: TipoVehiculo.FURGON, pesoMaximo: 1800, volumenMaximo: 14 },
      'default-camioneta': { tipo: TipoVehiculo.CAMIONETA, pesoMaximo: 800, volumenMaximo: 5 },
      'default-moto': { tipo: TipoVehiculo.MOTOCICLETA, pesoMaximo: 15, volumenMaximo: 0.15 }
    };
    
    // Determinar tipo de vehículo basado en el ID o asignar uno aleatorio
    let tipo: TipoVehiculo;
    let capacidadBase;
    
    if (vehiculoId.includes('camion')) {
      tipo = TipoVehiculo.CAMION;
      capacidadBase = vehiculosDatosMock['default-camion'];
    } else if (vehiculoId.includes('furgon')) {
      tipo = TipoVehiculo.FURGON;
      capacidadBase = vehiculosDatosMock['default-furgon'];
    } else if (vehiculoId.includes('camioneta')) {
      tipo = TipoVehiculo.CAMIONETA;
      capacidadBase = vehiculosDatosMock['default-camioneta'];
    } else if (vehiculoId.includes('moto')) {
      tipo = TipoVehiculo.MOTOCICLETA;
      capacidadBase = vehiculosDatosMock['default-moto'];
    } else {
      // Asignar tipo aleatorio
      const tipos = Object.values(TipoVehiculo);
      tipo = tipos[Math.floor(Math.random() * tipos.length)];
      
      const defaultKey = `default-${tipo.toLowerCase()}`;
      capacidadBase = vehiculosDatosMock[defaultKey] || vehiculosDatosMock['default-furgon'];
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
} 
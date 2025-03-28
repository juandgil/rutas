import { controller, httpGet, httpPost, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../../infrastructure/ioc/types';
import { ApiResponse } from '../dtos/common.dto';
import { 
  CondicionTrafico, 
  CondicionClima, 
  ImpactoRuta,
  NivelTrafico,
  EstadoClima,
  NivelImpacto,
  Coordenadas
} from '../../domain/interfaces/external-apis.interface';
import { IDatabase } from '../../infrastructure/database/database';

/**
 * @swagger
 * tags:
 *   name: APIs Externas
 *   description: Endpoints que simulan interacción con servicios externos de tráfico, clima y cálculo de impacto
 */
@controller('/api/trafico-clima')
export class TraficoClimaController {
  constructor(
    @inject(TYPES.IDatabase) private db: IDatabase
  ) {}

  @httpGet('/trafico/:ciudadId')
  async getTrafico(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const ciudadId = req.params.ciudadId;
      
      // Verificar que la ciudad existe
      const ciudad = await this.existeCiudad(ciudadId);
      if (!ciudad) {
        return res.status(200).json(
          new ApiResponse(false, 'Ciudad no encontrada', null)
        );
      }
      
      // Generar datos de tráfico
      // En una implementación real, estos datos vendrían de sensores o fuentes externas
      const nivelesTrafico = Object.values(NivelTrafico);
      const nivelAleatorio = nivelesTrafico[Math.floor(Math.random() * nivelesTrafico.length)];
      
      const descripciones = {
        [NivelTrafico.BAJO]: 'Tráfico fluido en toda la ciudad',
        [NivelTrafico.MEDIO]: 'Tráfico moderado en algunas vías principales',
        [NivelTrafico.ALTO]: 'Tráfico denso en varias zonas de la ciudad',
        [NivelTrafico.CONGESTIONADO]: 'Congestión severa en múltiples puntos'
      };
      
      const condicionTrafico: CondicionTrafico = {
        ciudadId,
        nivel: nivelAleatorio,
        descripcion: descripciones[nivelAleatorio],
        timestamp: new Date()
      };
      
      return res.status(200).json(
        new ApiResponse(true, 'Condiciones de tráfico obtenidas', condicionTrafico)
      );
    } catch (error) {
      console.error('Error al obtener condiciones de tráfico:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al consultar las condiciones de tráfico', null)
      );
    }
  }

  @httpGet('/clima/:ciudadId')
  async getClima(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const ciudadId = req.params.ciudadId;
      
      // Verificar que la ciudad existe
      const ciudad = await this.existeCiudad(ciudadId);
      if (!ciudad) {
        return res.status(200).json(
          new ApiResponse(false, 'Ciudad no encontrada', null)
        );
      }
      
      // Generar datos de clima
      const estadosClima = Object.values(EstadoClima);
      const estadoAleatorio = estadosClima[Math.floor(Math.random() * estadosClima.length)];
      
      // Generar datos realistas según el estado del clima
      let temperatura = 0;
      let lluvia = 0;
      let viento = 0;
      let visibilidad = 10;
      
      switch (estadoAleatorio) {
        case EstadoClima.DESPEJADO:
          temperatura = 18 + (Math.random() * 12); // 18-30°C
          lluvia = 0;
          viento = Math.random() * 10; // 0-10 km/h
          visibilidad = 8 + (Math.random() * 2); // 8-10 km
          break;
        case EstadoClima.NUBLADO:
          temperatura = 14 + (Math.random() * 10); // 14-24°C
          lluvia = Math.random() * 0.5; // 0-0.5 mm
          viento = 5 + (Math.random() * 15); // 5-20 km/h
          visibilidad = 5 + (Math.random() * 3); // 5-8 km
          break;
        case EstadoClima.LLUVIOSO:
          temperatura = 10 + (Math.random() * 8); // 10-18°C
          lluvia = 2 + (Math.random() * 8); // 2-10 mm
          viento = 10 + (Math.random() * 20); // 10-30 km/h
          visibilidad = 2 + (Math.random() * 3); // 2-5 km
          break;
        case EstadoClima.TORMENTA:
          temperatura = 8 + (Math.random() * 7); // 8-15°C
          lluvia = 10 + (Math.random() * 20); // 10-30 mm
          viento = 20 + (Math.random() * 40); // 20-60 km/h
          visibilidad = 0.5 + (Math.random() * 1.5); // 0.5-2 km
          break;
      }
      
      // Descripciones según el estado del clima
      const descripciones = {
        [EstadoClima.DESPEJADO]: 'Cielo despejado, condiciones óptimas para circulación',
        [EstadoClima.NUBLADO]: 'Cielo nublado, visibilidad aceptable',
        [EstadoClima.LLUVIOSO]: 'Lluvia moderada, precaución en las vías',
        [EstadoClima.TORMENTA]: 'Tormenta fuerte, visibilidad reducida y riesgo de inundaciones'
      };
      
      const condicionClima: CondicionClima = {
        ciudadId,
        estado: estadoAleatorio,
        temperatura: Math.round(temperatura * 10) / 10, // Redondear a 1 decimal
        lluvia: Math.round(lluvia * 10) / 10,
        viento: Math.round(viento),
        visibilidad: Math.round(visibilidad * 10) / 10,
        descripcion: descripciones[estadoAleatorio],
        timestamp: new Date()
      };
      
      return res.status(200).json(
        new ApiResponse(true, 'Condiciones climáticas obtenidas', condicionClima)
      );
    } catch (error) {
      console.error('Error al obtener condiciones climáticas:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al consultar las condiciones climáticas', null)
      );
    }
  }

  @httpPost('/impacto')
  async getImpacto(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const { origen, destino } = req.body;
      
      // Asegurarnos de que origen y destino existan
      if (!origen || !destino) {
        return res.status(400).json(
          new ApiResponse(false, 'Datos de coordenadas inválidos: falta origen o destino', null)
        );
      }
      
      // Convertir valores de string a número si es necesario
      const origenNumerico = {
        latitud: typeof origen.latitud === 'string' ? parseFloat(origen.latitud) : origen.latitud,
        longitud: typeof origen.longitud === 'string' ? parseFloat(origen.longitud) : origen.longitud
      };
      
      const destinoNumerico = {
        latitud: typeof destino.latitud === 'string' ? parseFloat(destino.latitud) : destino.latitud,
        longitud: typeof destino.longitud === 'string' ? parseFloat(destino.longitud) : destino.longitud
      };
      
      // Validar que las coordenadas sean números válidos
      if (!this.esNumero(origenNumerico.latitud) || !this.esNumero(origenNumerico.longitud) ||
          !this.esNumero(destinoNumerico.latitud) || !this.esNumero(destinoNumerico.longitud)) {
        return res.status(400).json(
          new ApiResponse(false, 'Datos de coordenadas inválidos: no son números válidos', null)
        );
      }
      
      // Calcular distancia entre puntos (fórmula simplificada para demo)
      const distancia = Math.sqrt(
        Math.pow(destinoNumerico.latitud - origenNumerico.latitud, 2) +
        Math.pow(destinoNumerico.longitud - origenNumerico.longitud, 2)
      ) * 111.32; // Aproximación a km (1 grado ~ 111.32 km en el ecuador)
      
      // Generar un impacto basado en la distancia
      let nivelImpacto: NivelImpacto;
      let factor = 0;
      
      if (distancia < 5) {
        // Distancias cortas tienen impactos menores
        const probabilidad = Math.random();
        if (probabilidad < 0.7) {
          nivelImpacto = NivelImpacto.BAJO;
          factor = 0.1;
        } else if (probabilidad < 0.9) {
          nivelImpacto = NivelImpacto.MEDIO;
          factor = 0.2;
        } else {
          nivelImpacto = NivelImpacto.ALTO;
          factor = 0.3;
        }
      } else if (distancia < 15) {
        // Distancias medias
        const probabilidad = Math.random();
        if (probabilidad < 0.4) {
          nivelImpacto = NivelImpacto.BAJO;
          factor = 0.15;
        } else if (probabilidad < 0.8) {
          nivelImpacto = NivelImpacto.MEDIO;
          factor = 0.25;
        } else {
          nivelImpacto = Math.random() < 0.8 ? NivelImpacto.ALTO : NivelImpacto.CRITICO;
          factor = 0.35;
        }
      } else {
        // Distancias largas tienen impactos mayores
        const probabilidad = Math.random();
        if (probabilidad < 0.2) {
          nivelImpacto = NivelImpacto.BAJO;
          factor = 0.2;
        } else if (probabilidad < 0.5) {
          nivelImpacto = NivelImpacto.MEDIO;
          factor = 0.3;
        } else if (probabilidad < 0.8) {
          nivelImpacto = NivelImpacto.ALTO;
          factor = 0.4;
        } else {
          nivelImpacto = NivelImpacto.CRITICO;
          factor = 0.5;
        }
      }
      
      // Calcular tiempo y distancia adicionales
      const tiempoAdicional = Math.round(distancia * factor * 60); // en minutos
      const distanciaAdicional = Math.round(distancia * factor * 10) / 10; // en km
      
      const impacto: ImpactoRuta = {
        tiempoAdicional,
        distanciaAdicional,
        nivelImpacto
      };
      
      return res.status(200).json(
        new ApiResponse(true, 'Impacto calculado exitosamente', impacto)
      );
    } catch (error) {
      console.error('Error al calcular impacto de ruta:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al calcular el impacto de la ruta', null)
      );
    }
  }

  // Método auxiliar para verificar si una ciudad existe
  private async existeCiudad(ciudadId: string): Promise<boolean> {
    try {
      // En una implementación real, consultaríamos la base de datos
      // Para simplificar, consideramos válidos los IDs ciudad-001, ciudad-002, etc.
      if (ciudadId.match(/^ciudad-\d{3}$/)) {
        return true;
      }
      
      // Opcionalmente, verificar en base de datos
      // const query = 'SELECT id FROM ciudades WHERE id = $1';
      // const result = await this.db.query(query, [ciudadId]);
      // return result.length > 0;
      
      return false;
    } catch (error) {
      console.error('Error al verificar existencia de ciudad:', error);
      return false;
    }
  }

  // Método auxiliar para validar números
  private esNumero(valor: any): boolean {
    return typeof valor === 'number' && !isNaN(valor);
  }
} 
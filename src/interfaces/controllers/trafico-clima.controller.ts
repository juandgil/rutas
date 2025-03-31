import { Request, Response } from 'express';
import { controller, httpGet, httpPost, request, response, requestParam } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '../../infrastructure/ioc/types';
import { ITraficoClimaService } from '../../application/interfaces/trafico-clima-service.interface';
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
 *   name: TraficoClima
 *   description: Endpoints para obtener información de tráfico y condiciones climáticas
 */
@controller('/trafico-clima')
export class TraficoClimaController {

  constructor(
    @inject(TYPES.ITraficoClimaService) private traficoClimaService: ITraficoClimaService
  ) {}

  /**
   * @swagger
   * /trafico-clima/trafico/{ciudadId}:
   *   get:
   *     summary: Obtiene las condiciones de tráfico actuales para una ciudad
   *     tags: [TraficoClima]
   *     parameters:
   *       - in: path
   *         name: ciudadId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la ciudad
   *         example: "ciudad-001"
   *     responses:
   *       200:
   *         description: Condiciones de tráfico obtenidas exitosamente
   *       404:
   *         description: Ciudad no encontrada
   *       500:
   *         description: Error al obtener condiciones de tráfico
   */
  @httpGet('/trafico/:ciudadId')
  async obtenerCondicionesTrafico(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const { ciudadId } = req.params;
      
      const condiciones = await this.traficoClimaService.obtenerCondicionesTrafico(ciudadId);
      
      return res.status(200).json(
        new ApiResponse(true, 'Condiciones de tráfico obtenidas correctamente', condiciones)
      );
    } catch (error) {
      console.error(`Error al obtener condiciones de tráfico: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al obtener condiciones de tráfico', { error: (error as Error).message })
      );
    }
  }

  /**
   * @swagger
   * /trafico-clima/clima/{ciudadId}:
   *   get:
   *     summary: Obtiene las condiciones climáticas actuales para una ciudad
   *     tags: [TraficoClima]
   *     parameters:
   *       - in: path
   *         name: ciudadId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la ciudad
   *         example: "ciudad-001"
   *     responses:
   *       200:
   *         description: Condiciones climáticas obtenidas exitosamente
   *       404:
   *         description: Ciudad no encontrada
   *       500:
   *         description: Error al obtener condiciones climáticas
   */
  @httpGet('/clima/:ciudadId')
  async obtenerCondicionesClima(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const { ciudadId } = req.params;
      
      const condiciones = await this.traficoClimaService.obtenerCondicionesClima(ciudadId);
      
      return res.status(200).json(
        new ApiResponse(true, 'Condiciones climáticas obtenidas correctamente', condiciones)
      );
    } catch (error) {
      console.error(`Error al obtener condiciones climáticas: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al obtener condiciones climáticas', { error: (error as Error).message })
      );
    }
  }

  /**
   * @swagger
   * /trafico-clima/evaluacion/{ciudadId}:
   *   get:
   *     summary: Obtiene una evaluación general de las condiciones de tráfico y clima
   *     tags: [TraficoClima]
   *     parameters:
   *       - in: path
   *         name: ciudadId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la ciudad
   *         example: "ciudad-001"
   *     responses:
   *       200:
   *         description: Evaluación obtenida exitosamente
   *       404:
   *         description: Ciudad no encontrada
   *       500:
   *         description: Error al obtener evaluación
   */
  @httpGet('/evaluacion/:ciudadId')
  async obtenerEvaluacionCondiciones(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const { ciudadId } = req.params;
      
      const evaluacion = await this.traficoClimaService.evaluarCondicionesGenerales(ciudadId);
      
      return res.status(200).json(
        new ApiResponse(true, 'Evaluación de condiciones obtenida correctamente', evaluacion)
      );
    } catch (error) {
      console.error(`Error al obtener evaluación de condiciones: ${(error as Error).message}`);
      return res.status(500).json(
        new ApiResponse(false, 'Error al obtener evaluación de condiciones', { error: (error as Error).message })
      );
    }
  }

  /**
   * @swagger
   * /trafico-clima/impacto:
   *   post:
   *     summary: Obtiene impacto de las condiciones de tráfico y clima en una ruta
   *     tags: [APIs Externas]
   */
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
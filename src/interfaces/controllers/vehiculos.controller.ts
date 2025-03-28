import { controller, httpGet, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../../infrastructure/ioc/types';
import { IVehiculoRepository } from '../../domain/repositories/vehiculo.repository';
import { ApiResponse } from '../dtos/common.dto';

/**
 * @swagger
 * tags:
 *   name: Vehiculos
 *   description: Endpoints para gestión de la flota de vehículos
 */
@controller('/api/vehiculos')
export class VehiculosController {
  constructor(
    @inject(TYPES.IVehiculoRepository) private vehiculoRepository: IVehiculoRepository
  ) {}

  /**
   * @swagger
   * /api/vehiculos/{id}:
   *   get:
   *     summary: Obtiene información detallada de un vehículo
   *     tags: [Vehiculos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del vehículo
   *     responses:
   *       200:
   *         description: Información del vehículo o mensaje informativo
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   nullable: true
   *       500:
   *         description: Error del servidor
   */
  @httpGet('/:id')
  async getVehiculoById(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const vehiculoId = req.params.id;
      
      // Buscar el vehículo en la base de datos
      const vehiculo = await this.vehiculoRepository.findById(vehiculoId);
      
      if (!vehiculo) {
        return res.status(200).json(
          new ApiResponse(false, 'Vehículo no encontrado', null)
        );
      }
      
      // Incluir información adicional para simular lo que devolvería una API externa
      const vehiculoInfo = {
        ...vehiculo,
        capacidad: {
          pesoMaximo: vehiculo.capacidadPeso,
          volumenMaximo: vehiculo.capacidadVolumen
        },
        estado: {
          disponible: vehiculo.disponible,
          ultimoMantenimiento: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        }
      };
      
      return res.status(200).json(
        new ApiResponse(true, 'Vehículo encontrado', vehiculoInfo)
      );
    } catch (error) {
      console.error('Error al obtener información del vehículo:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al consultar la información del vehículo', null)
      );
    }
  }

  /**
   * @swagger
   * /api/vehiculos:
   *   get:
   *     summary: Obtiene lista de vehículos
   *     tags: [Vehiculos]
   *     responses:
   *       200:
   *         description: Lista de vehículos
   *       500:
   *         description: Error del servidor
   */
  @httpGet('/')
  async getVehiculos(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      // Buscar todos los vehículos
      const vehiculos = await this.vehiculoRepository.findAll();
      
      // Transformar la respuesta para incluir información adicional
      const vehiculosInfo = vehiculos.map(vehiculo => ({
        ...vehiculo,
        capacidad: {
          pesoMaximo: vehiculo.capacidadPeso,
          volumenMaximo: vehiculo.capacidadVolumen
        },
        estado: {
          disponible: vehiculo.disponible
        }
      }));
      
      return res.status(200).json(
        new ApiResponse(true, 'Lista de vehículos', vehiculosInfo)
      );
    } catch (error) {
      console.error('Error al obtener lista de vehículos:', error);
      return res.status(500).json(
        new ApiResponse(false, 'Error al consultar la lista de vehículos', null)
      );
    }
  }
} 
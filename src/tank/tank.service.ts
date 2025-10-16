import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTankDto, UpdateTankDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { GetTankDetailResponse, GetTanksListResponse } from './response';

@Injectable()
export class TankService {
  constructor(private readonly prisma: PrismaService) {}

  async createTank(
    userId: string,
    dto: CreateTankDto,
  ): Promise<MessageResponse> {
    try {
      const newTank = await this.prisma.tank.create({
        data: {
          userId: userId,
          name: dto.name,
          whitelegShrimpStrain: dto.whitelegShrimpStrain,
          averageBodyWeight: dto.averageBodyWeight,
          numberStocked: dto.numberStocked,
          salinity: dto.salinity || undefined,
          husbandryData: {
            create: {
              date: new Date(),
              waterTemperature: dto.waterTemperature || undefined,
              do: dto.do || undefined,
              ph: dto.ph || undefined,
              nh4: dto.nh4 || undefined,
              no2: dto.no2 || undefined,
              alk: dto.alk || undefined,
              salinity: dto.salinity || undefined,
            },
          },
        },
      });

      return {
        message: 'Tank created successfully',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async updateTank(
    userId: string,
    id: string,
    dto: UpdateTankDto,
  ): Promise<MessageResponse> {
    try {
      const existingTank = await this.prisma.tank.findFirst({
        where: {
          id: id,
          userId: userId,
        },
      });

      if (!existingTank) {
         throw new NotFoundException('Tank not found');
      }

      // Proceed with the update if the tank exists and belongs to the user
      const newTank = await this.prisma.tank.update({
        where: { id: id },
        data: {
          name: dto.name || undefined,
          whitelegShrimpStrain: dto.whitelegShrimpStrain || undefined,
          averageBodyWeight: dto.averageBodyWeight || undefined,
          numberStocked: dto.numberStocked || undefined,
          salinity: dto.salinity || undefined,
        },
      });

      return {
        message: 'Tank Updated successfully',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async getAllTanks(userId: string): Promise<GetTanksListResponse[]> {
    try {
      const tanks = await this.prisma.tank.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          name: true,
          tankerId: true,
          createdAt: true,
        },
      });

      return tanks;
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async getTankDetail(
    userId: string,
    id: string,
  ): Promise<GetTankDetailResponse> {
    try {
      const existingTank = await this.prisma.tank.findFirst({
        where: {
          id: id,
          userId: userId,
        },
      });

      if (!existingTank) {
        throw new NotFoundException('Tank not found');
      }

      return {
        id: existingTank.id,
        name: existingTank.name,
        whitelegShrimpStrain: existingTank.whitelegShrimpStrain,
        averageBodyWeight: existingTank.averageBodyWeight,
        numberStocked: existingTank.numberStocked,
        salinity: existingTank.salinity
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async deleteTank(userId: string, id: string): Promise<MessageResponse> {
    try {
      const existingTank = await this.prisma.tank.findUnique({
        where: { id: id, userId: userId },
      });
      if (!existingTank) {
        throw new BadRequestException('Tank not found');
      }

      // delete tank and all related data
      await this.prisma.tank.delete({
        where: { id: id },
      });

      return {
        message: 'Tank has been deleted.',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }
}

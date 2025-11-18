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
import { GetAdminTanksListResponse, GetTankDetailResponse, GetTanksListResponse } from './response';
import { formatId } from 'src/common/utils';

@Injectable()
export class TankService {
  constructor(private readonly prisma: PrismaService) {}

  async createTank(
    userId: string,
    dto: CreateTankDto,
  ): Promise<GetTanksListResponse> {
    try {
      const newTank = await this.prisma.tank.create({
        data: {
          userId: userId,
          name: dto.name,
          whitelegShrimpStrain: dto.whitelegShrimpStrain,
          averageBodyWeight: dto.averageBodyWeight,
          numberStocked: dto.numberStocked,
          salinity: dto.salinity || undefined,
        },
      });

      const createdHusbandryData = await this.prisma.husbandryData.create({
        data: {
          tankId: newTank.id,
          date: newTank.createdAt,
          waterTemperature: dto.waterTemperature || undefined,
          do: dto.do || undefined,
          ph: dto.ph || undefined,
          nh4: dto.nh4 || undefined,
          no2: dto.no2 || undefined,
          alk: dto.alk || undefined,
          salinity: dto.salinity || undefined,
        },
      });

      return {
        id: newTank.id,
        name: newTank.name,
        tankerId: formatId(newTank.tankerId),
        whitelegShrimpStrain: newTank.whitelegShrimpStrain,
        averageBodyWeight: newTank.averageBodyWeight,
        numberStocked: newTank.numberStocked,
        salinity: newTank.salinity,
        createdAt: newTank.createdAt,
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
  ): Promise<GetTanksListResponse> {
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
          salinity: dto.salinity || null,
        },
        include: {
          husbandryData: { take: 1, orderBy: { date: 'asc' },}
        },
      });

      if(newTank.husbandryData.length ===0){
        await this.prisma.husbandryData.update({
          where: { id: newTank.husbandryData[0].id },
          data: {
            salinity: dto.salinity || null,
          },
        });
      }

      return {
        id: newTank.id,
        name: newTank.name,
        tankerId: formatId(newTank.tankerId),
        whitelegShrimpStrain: newTank.whitelegShrimpStrain,
        averageBodyWeight: newTank.averageBodyWeight,
        numberStocked: newTank.numberStocked,
        salinity: newTank.salinity,
        createdAt: newTank.createdAt,
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
        orderBy: { createdAt: 'asc' },
      });

      let formattedTanks = tanks.map((tank) => ({
        id: tank.id,
        name: tank.name,
        tankerId: formatId(tank.tankerId),
        whitelegShrimpStrain: tank.whitelegShrimpStrain,
        averageBodyWeight: tank.averageBodyWeight,
        numberStocked: tank.numberStocked,
        salinity: tank.salinity,
        createdAt: tank.createdAt,
      }));

      return formattedTanks;
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
        salinity: existingTank.salinity,
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

  async getUserTanks(userId: string): Promise<GetAdminTanksListResponse[]> {
    try {
      const tanks = await this.prisma.tank.findMany({
        where: {
          userId: userId,
        },
        include:{
          records:{ take: 1, orderBy: { createdAt: 'desc' }},
          conditions:{ take: 1, orderBy: { createdAt: 'desc' }},
          recurringConditions:{ take: 1, orderBy: { createdAt: 'desc' }},
          feedIncreaseConditions:{ take: 1, orderBy: { createdAt: 'desc' }},
        },
        orderBy: { createdAt: 'asc' },
      });

      let formattedTanks = tanks.map((tank) => ({
        id: tank.id,
        name: tank.name,
        tankerId: formatId(tank.tankerId),
        whitelegShrimpStrain: tank.whitelegShrimpStrain,
        averageBodyWeight: tank.averageBodyWeight,
        numberStocked: tank.numberStocked,
        salinity: tank.salinity,
        shrimpOutput: tank.records?.[0]?.shrimpWeight?? (tank.numberStocked * tank.averageBodyWeight) / 1000,
        hasCondition: (tank.conditions.length > 0) || (tank.recurringConditions.length > 0) || (tank.feedIncreaseConditions.length > 0),
      }));

      return formattedTanks;
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }
}

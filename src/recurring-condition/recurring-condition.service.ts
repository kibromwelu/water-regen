import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateRecurringConditionDto,
  UpdateRecurringConditionDto,
} from './dto';
import { MessageResponse } from 'src/common/response';
import { GetRecurringConditionDetailResponse } from './response';
import { getKoreaDate, koreaToUtc, utcToKorea } from 'src/common/utils';

@Injectable()
export class RecurringConditionService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecurringCondition(
    userId: string,
    dto: CreateRecurringConditionDto,
  ): Promise<MessageResponse> {
    try {
      let utcDate;
      if (dto.endDate) {
        utcDate = koreaToUtc(dto.endDate);
      }
      const existingTank = await this.prisma.tank.findFirst({
        where: {
          id: dto.tankId,
          userId: userId,
        },
      });

      if (!existingTank) {
        throw new NotFoundException('Recurring condition not found');
      }

      // Use Prisma transaction
      const { newRecurringCondition, todo } = await this.prisma.$transaction(
        async (tx) => {
          // create a recurring condition
          const newRecurringCondition =
            await this.prisma.recurringCondition.create({
              data: {
                tankId: dto.tankId,
                name: dto.name,
                intervalType: dto.intervalType,
                intervalValue: dto.intervalValue,
                endDate: utcDate || undefined,
                endingCount: dto.endingCount || undefined,
                message: dto.message,
                lastMessageSent: new Date(),
                totalMessageSent: 1,
              },
            });

          // create a todo list
          const todo = await this.prisma.todo.create({
            data: {
              tankId: dto.tankId,
              message: dto.message,
              type: 'RECURRING',
            },
          });
          return { newRecurringCondition, todo };
        },
      );

      // Todo: send fcm notification

      return {
        message: 'Recurring condition created successfully',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async updateRecurringCondition(
    userId: string,
    id: string,
    dto: UpdateRecurringConditionDto,
  ): Promise<MessageResponse> {
    try {
      let utcDate;
      if (dto.endDate) {
        utcDate = koreaToUtc(dto.endDate);
      }

      if (dto.tankId) {
        const existingTank = await this.prisma.tank.findFirst({
          where: {
            id: dto.tankId,
            userId: userId,
          },
        });

        if (!existingTank) {
          throw new NotFoundException('Recurring condition not found');
        }
      }

      const existingRecurringCondition =
        await this.prisma.recurringCondition.findFirst({
          where: { id: id },
        });

      if (!existingRecurringCondition) {
        throw new NotFoundException('Recurring condition not found');
      }

      // create a recurring condition

      const updateRecurringCondition =
        await this.prisma.recurringCondition.update({
          where: { id: id },
          data: {
            tankId: dto.tankId || undefined,
            name: dto.name || undefined,
            intervalType: dto.intervalType || undefined,
            intervalValue: dto.intervalValue || undefined,
            endDate: utcDate || undefined,
            endingCount: dto.endingCount || undefined,
            message: dto.message,
          },
        });

      return {
        message: 'Recurring condition updated successfully',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async getDetailRecurringCondition(
    userId: string,
    id: string,
  ): Promise<GetRecurringConditionDetailResponse> {
    try {
      const existingRecurringCondition =
        await this.prisma.recurringCondition.findFirst({
          where: { id: id, tank: { userId } },
          select: {
            id: true,
            name: true,
            tank: {
              select: {
                id: true,
                name: true,
              },
            },
            intervalType: true,
            intervalValue: true,
            endDate: true,
            endingCount: true,
            message: true,
          },
        });

      if (!existingRecurringCondition) {
        throw new NotFoundException('Recurring condition not found');
      }
      
      return {
        ...existingRecurringCondition,
        endDate: existingRecurringCondition.endDate
          ? getKoreaDate(
              utcToKorea(existingRecurringCondition.endDate.toString()),
            )
          : null,
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async deleteRecurringCondition(
    userId: string,
    id: string,
  ): Promise<MessageResponse> {
    try {
      const existingRecurringCoundition =
        await this.prisma.recurringCondition.findUnique({
          where: { id: id, tank: { userId } },
        });
      if (!existingRecurringCoundition) {
        throw new NotFoundException('Recurring condition not found');
      }

      // delete tank and all related data
      await this.prisma.recurringCondition.delete({
        where: { id: id },
      });

      return {
        message: 'Recurring condition has been deleted.',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }
}

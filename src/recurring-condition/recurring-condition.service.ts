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
import { EndType, GetRecurringConditionDetailResponse } from './response';
import { getKoreaDate, koreaToUtc, utcToKorea } from 'src/common/utils';
import { FcmService } from 'src/fcm/fcm.service';
import { ConditionData } from 'src/condition/response';

@Injectable()
export class RecurringConditionService {
  constructor(
    private readonly prisma: PrismaService,
    private fcmService: FcmService,
  ) {}

  async createRecurringCondition(
    userId: string,
    dto: CreateRecurringConditionDto,
  ): Promise<ConditionData> {
    try {
      
      if(dto.endDate && dto.endingCount){
        // only accept endDate if both are provided
        dto.endingCount = undefined;
      }
      
      let utcDate;
      if (dto.endDate) {
        utcDate = koreaToUtc(dto.endDate, '23:59');
      }
      const existingTank = await this.prisma.tank.findFirst({
        where: {
          id: dto.tankId,
          userId: userId,
        },
      });

      if (!existingTank) {
        throw new NotFoundException('Tank not found');
      }

      // Use Prisma transaction
      const { newRecurringCondition, todo } = await this.prisma.$transaction(
        async (tx) => {
          // create a recurring condition
          const newRecurringCondition = await tx.recurringCondition.create({
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
          const todo = await tx.todo.create({
            data: {
              tankId: dto.tankId,
              message: dto.message,
              type: 'RECURRING',
            },
            include: { tank: true },
          });
          return { newRecurringCondition, todo };
        },
      );

      // Todo: send fcm notification
      if (todo) {
        await this.fcmService.sendTodoNotification({
          userId: todo.tank.userId,
          tankId: todo.tankId,
          tankName: todo.tank.name,
          todoId: todo.id,
          message: todo.message,
          createdAt: todo.createdAt,
        });
      }

      return {
        id: newRecurringCondition.id,
        name: newRecurringCondition.name,
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
    dto: CreateRecurringConditionDto,
  ): Promise<ConditionData> {
    try {
      if(dto.endDate && dto.endingCount){
        // only accept endDate if both are provided
        dto.endingCount = undefined;
      }
      
      let utcDate;
      if (dto.endDate) {
        utcDate = koreaToUtc(dto.endDate, '23:59');
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
            endDate: utcDate || null,
            endingCount: dto.endingCount || null,
            message: dto.message,
          },
        });

      return {
        id: updateRecurringCondition.id,
        name: updateRecurringCondition.name,
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
    role: string
  ): Promise<GetRecurringConditionDetailResponse> {
    try {
      let whereClause = role === 'ADMIN' ? { id } : { id, tank: { userId } };
      const existingRecurringCondition =
        await this.prisma.recurringCondition.findFirst({
          where: whereClause,
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
        endType: existingRecurringCondition.endDate? EndType.DATE : existingRecurringCondition.endingCount ? EndType.COUNT : EndType.NONE,
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

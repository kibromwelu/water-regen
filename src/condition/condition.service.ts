import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlertConditionDetailResponse, ConditionsListResponse, FeedingConditionDetailResponse } from './response';
import { AlertConditionDto, CreateFeedingConditionDto, UpdateFeedingConditionDto } from './dto';
import { MessageResponse } from 'src/common/response';

@Injectable()
export class ConditionService {

    constructor(private readonly prisma: PrismaService) { }

    async getAllConditions(): Promise<ConditionsListResponse> {
        try {
            let feedingConditionsQuery = this.prisma.condition.findMany({ where: { type: 'FEEDING' }, select: { id: true, name: true } })
            let alertConditionsQuery = this.prisma.condition.findMany({ where: { type: 'ALERT' }, select: { id: true, name: true } })
            let recurringConditionsQuery = this.prisma.recurringCondition.findMany({ select: { id: true, name: true } })
            let feedIncreaseConditionsQuery = this.prisma.feedIncreaseCondition.findMany({ select: { id: true, name: true } })
            let [feedingConditions, alertConditions, recurringConditions, feedIncreaseConditions] = await Promise.all([feedingConditionsQuery, alertConditionsQuery, recurringConditionsQuery, feedIncreaseConditionsQuery])
            // return {
            //     feedingConditions: feedingConditions,
            //     alertConditions: alertConditions,
            //     recurringConditions: recurringConditions,
            //     feedIncreaseConditions: feedIncreaseConditions,
            // };
            return {
                feedingConditions: feedingConditions,
                alertConditions: alertConditions,
                recurringConditions: recurringConditions,
                feedIncreaseConditions: feedIncreaseConditions,
            }

        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async getFeedingConditionDetail(id: string): Promise<FeedingConditionDetailResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id }, include: { tank: true } });
            if (!condition) throw new HttpException('Condition not found', 404);

            return {
                id: condition.id,
                name: condition.name,
                tank: { id: condition.tank.id, name: condition.tank.name },
                sensor: condition.sensor,
                value: condition.value,
                condition: condition.condition,
                recommendation: condition.recommendation
            };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async createFeedingCondition(dto: CreateFeedingConditionDto): Promise<MessageResponse> {
        try {
            let tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId } });
            if (!tank) throw new HttpException('Tank not found', 404);

            let condition = await this.prisma.condition.create({ data: { ...dto, message: `${tank.name}의 ${dto.sensor}가 ${dto.value} 이상입니다. ${dto.recommendation} 급 이 권고`, type: 'FEEDING' } });
            console.log(condition.message);
            return { message: 'Feeding condition created' };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async updateFeedingCondition(id: string, dto: UpdateFeedingConditionDto): Promise<MessageResponse> {
        try {

            if (!dto.tankId) {
                throw new HttpException('Tank ID is required', 400);
            }
            let tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId } });
            if (!tank) {
                throw new NotFoundException('Tank not found');
            }

            let condition = await this.prisma.condition.findUnique({ where: { id } });
            if (!condition) throw new NotFoundException('Condition not found');

            let message = `${tank.name}의 ${dto.sensor ?? condition.sensor}가 ${dto.value ?? condition.value} 이상입니다. ${dto.recommendation ?? condition.recommendation} 급 이 권고`;
            await this.prisma.condition.update({ where: { id }, data: { ...dto, message } });
            return { message: 'Feeding condition updated' };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async deleteFeedingCondition(id: string): Promise<MessageResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id } });
            if (!condition) throw new NotFoundException('Condition not found');
            await this.prisma.condition.delete({ where: { id } });
            return { message: 'Feeding condition deleted' };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    // section 2: Warning condition
    async getAlertConditionDetail(id: string): Promise<AlertConditionDetailResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id }, include: { tank: true } });
            if (!condition) throw new NotFoundException('Condition not found');
            return {
                id: condition.id,
                name: condition.name,
                tank: { id: condition.tank.id, name: condition.tank.name },
                sensor: condition.sensor,
                value: condition.value,
                condition: condition.condition,
            }
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async createAlertCondition(dto: AlertConditionDto): Promise<MessageResponse> {
        try {
            let tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId } });
            if (!tank) throw new HttpException('Tank not found', 404);
            let message = `${tank.name}의 ${dto.sensor}가 ${dto.value} 이상입니다. 즉시 확인 바랍니다.`;
            let condition = await this.prisma.condition.create({ data: { ...dto, message, type: 'ALERT' } });
            return { message: 'Alert condition created', };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async updateAlertCondition(id: string, dto: AlertConditionDto) {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id } });
            if (!condition) throw new NotFoundException('Condition not found');

            await this.prisma.condition.update({ where: { id }, data: { ...dto } });
            return { message: 'Alert condition updated' };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async deleteAlertCondition(id: string): Promise<MessageResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id } });
            if (!condition) throw new NotFoundException('Condition not found');

            await this.prisma.condition.delete({ where: { id } });
            return { message: 'Alert condition deleted' };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }


}

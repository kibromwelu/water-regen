import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlertConditionDetailResponse, ConditionData, ConditionsListResponse, FeedingConditionDetailResponse } from './response';
import { AlertConditionDto, CopyConditionDto, CreateFeedingConditionDto, UpdateFeedingConditionDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { dot } from 'node:test/reporters';
import { RecurringConditionService } from 'src/recurring-condition/recurring-condition.service';
import { utcToKorea } from 'src/common/utils';

@Injectable()
export class ConditionService {

    constructor(private readonly prisma: PrismaService, private readonly recurringConditionService: RecurringConditionService) { }

    async getAllConditions(userId: string): Promise<ConditionsListResponse> {
        try {
            let feedingConditionsQuery = this.prisma.condition.findMany({ where: { type: 'FEEDING', tank: { userId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let alertConditionsQuery = this.prisma.condition.findMany({ where: { type: 'ALERT', tank: { userId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let recurringConditionsQuery = this.prisma.recurringCondition.findMany({ where: { tank: { userId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let feedIncreaseConditionsQuery = this.prisma.feedIncreaseCondition.findMany({ where: { tank: { userId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let [feedingConditions, alertConditions, recurringConditions, feedIncreaseConditions] = await Promise.all([feedingConditionsQuery, alertConditionsQuery, recurringConditionsQuery, feedIncreaseConditionsQuery])

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
    async getAllTankConditions(userId: string, tankId: string): Promise<ConditionsListResponse> {
        try {

            let feedingConditionsQuery = this.prisma.condition.findMany({ where: { type: 'FEEDING', tank: { userId, id: tankId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let alertConditionsQuery = this.prisma.condition.findMany({ where: { type: 'ALERT', tank: { userId, id: tankId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let recurringConditionsQuery = this.prisma.recurringCondition.findMany({ where: { tank: { userId, id: tankId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let feedIncreaseConditionsQuery = this.prisma.feedIncreaseCondition.findMany({ where: { tank: { userId, id: tankId } }, select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
            let [feedingConditions, alertConditions, recurringConditions, feedIncreaseConditions] = await Promise.all([feedingConditionsQuery, alertConditionsQuery, recurringConditionsQuery, feedIncreaseConditionsQuery])

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
    async getFeedingConditionDetail(id: string, userId: string): Promise<FeedingConditionDetailResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id, tank: { userId } }, include: { tank: true } });
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
    async createFeedingCondition(dto: CreateFeedingConditionDto, userId: string): Promise<ConditionData> {
        try {
            let tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId, userId } });
            if (!tank) throw new HttpException('Tank not found', 404);
            let message;
            //let recommendation = dto.recommendation=='Bicarbonate'? '중탄산':dto.recommendation=='Hydrated lime'? '소석회': dto.recommendation=='Vitamin'? '비타민': dto.recommendation=='Glucose'? '포도당':dto.recommendation=='Other supplements'? '기타 영양제': dto.recommendation;
            if (dto.condition == 'GTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이상입니다. ${dto.recommendation} 투여가 권장됩니다.`
            } else if (dto.condition == 'LTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이하입니다. ${dto.recommendation} 투여가 권장됩니다.`
            } else if (dto.condition == 'GT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 큽니다. ${dto.recommendation} 투여가 권장됩니다.`
            } else if (dto.condition == 'LT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 작습니다. ${dto.recommendation} 투여가 권장됩니다.`
            }

            let condition = await this.prisma.condition.create({ data: { ...dto, message: message, type: 'FEEDING' } });
            console.log(condition.message);
            return {
                id: condition.id,
                name: condition.name
            };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async updateFeedingCondition(id: string, dto: UpdateFeedingConditionDto, userId: string): Promise<ConditionData> {
        try {

            if (!dto.tankId) {
                throw new HttpException('Tank ID is required', 400);
            }
            let tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId, userId } });
            if (!tank) {
                throw new NotFoundException('Tank not found');
            }

            let condition = await this.prisma.condition.findUnique({ where: { id } });
            if (!condition) throw new NotFoundException('Condition not found');

            let message;
            //let recommendation = dto.recommendation=='Bicarbonate'? '중탄산':dto.recommendation=='Hydrated lime'? '소석회': dto.recommendation=='Vitamin'? '비타민': dto.recommendation=='Glucose'? '포도당':dto.recommendation=='Other supplements'? '기타 영양제': dto.recommendation;
            if (dto.condition == 'GTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이상입니다. ${dto.recommendation} 투여가 권장됩니다.`
            } else if (dto.condition == 'LTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이하입니다. ${dto.recommendation} 투여가 권장됩니다.`
            } else if (dto.condition == 'GT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 큽니다. ${dto.recommendation} 투여가 권장됩니다.`
            } else if (dto.condition == 'LT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 작습니다. ${dto.recommendation} 투여가 권장됩니다.`
            }
            //let message = `${tank.name}의 ${dto.sensor ?? condition.sensor}가 ${dto.value ?? condition.value} 이상입니다. ${dto.recommendation ?? condition.recommendation} 급 이 권고`;
            const updateCondition = await this.prisma.condition.update({ where: { id }, data: { ...dto, message } });
            return {
                id: updateCondition.id,
                name: updateCondition.name
            };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async deleteFeedingCondition(id: string, userId: string): Promise<MessageResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id, tank: { userId } } });
            if (!condition) throw new NotFoundException('Condition not found');
            await this.prisma.condition.delete({ where: { id } });
            return { message: 'Feeding condition deleted' };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    // section 2: Warning condition
    async getAlertConditionDetail(id: string, userId: string): Promise<AlertConditionDetailResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id, tank: { userId } }, include: { tank: true } });
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
    async createAlertCondition(dto: AlertConditionDto, userId: string): Promise<ConditionData> {
        try {
            let tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId, userId } });
            if (!tank) throw new HttpException('Tank not found', 404);
            //let message = `${tank.name}의 ${dto.sensor}가 ${dto.value} 이상입니다. 즉시 확인 바랍니다.`;
            let message;
            if (dto.condition == 'GTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이상입니다. 조치가 필요합니다.`
            } else if (dto.condition == 'LTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이하입니다. 조치가 필요합니다.`
            } else if (dto.condition == 'GT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 큽니다. 조치가 필요합니다.`
            } else if (dto.condition == 'LT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 작습니다. 조치가 필요합니다.`
            }
            let condition = await this.prisma.condition.create({ data: { ...dto, message, type: 'ALERT' } });
            return {
                id: condition.id,
                name: condition.name
            };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async updateAlertCondition(id: string, dto: AlertConditionDto, userId: string): Promise<ConditionData> {
        try {
            let tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId } });
            if (!tank) throw new NotFoundException('Tank not found');
            let condition = await this.prisma.condition.findUnique({ where: { id, tank: { userId } } });
            if (!condition) throw new NotFoundException('Condition not found');

            let message;
            if (dto.condition == 'GTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이상입니다. 조치가 필요합니다.`
            } else if (dto.condition == 'LTE') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value} 이하입니다. 조치가 필요합니다.`
            } else if (dto.condition == 'GT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 큽니다. 조치가 필요합니다.`
            } else if (dto.condition == 'LT') {
                message = `${tank.name}의 ${dto.sensor == 'WATER_TEMPERATURE' ? '수온' : dto.sensor}(이)가 ${dto.value}보다 작습니다. 조치가 필요합니다.`
            }

            const updateCondition = await this.prisma.condition.update({ where: { id }, data: { ...dto, message } });
            return {
                id: updateCondition.id,
                name: updateCondition.name
            };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async deleteAlertCondition(id: string, userId: string): Promise<MessageResponse> {
        try {
            let condition = await this.prisma.condition.findUnique({ where: { id, tank: { userId } } });
            if (!condition) throw new NotFoundException('Condition not found');

            await this.prisma.condition.delete({ where: { id } });
            return { message: 'Alert condition deleted' };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }

    async copyConditionsToTank(data: CopyConditionDto): Promise<MessageResponse> {
        try {
            const { conditionId, targetTankId, type } = data;

            if (type === 'FEEDING' || type === 'ALERT') {
                const condition = await this.prisma.condition.findUnique({ where: { id: conditionId } });

                if (!condition) {
                    throw new NotFoundException('Condition not found');
                }
                if (condition.tankId == targetTankId) {
                    throw new HttpException('Cannot copy condition to the same tank', 400);
                }
                await this.prisma.condition.create({
                    data: {
                        name: condition.name,
                        tankId: targetTankId,
                        sensor: condition.sensor,
                        value: condition.value,
                        condition: condition.condition,
                        recommendation: condition.recommendation,
                        message: condition.message,
                        type: condition.type,
                    }
                });
            }
            else if (type === 'RECURRING') {
                const recurringCondition = await this.prisma.recurringCondition.findUnique({ where: { id: conditionId }, include: { tank: true } });
                if (recurringCondition?.tankId == targetTankId) {
                    throw new HttpException('Cannot copy condition to the same tank', 400);
                }
                if (!recurringCondition) {
                    throw new NotFoundException('Recurring Condition not found');
                }
                await this.recurringConditionService.createRecurringCondition(
                    recurringCondition.tank.userId, {
                    name: recurringCondition.name,
                    tankId: targetTankId,
                    intervalType: recurringCondition.intervalType,
                    intervalValue: recurringCondition.intervalValue,
                    message: recurringCondition.message,
                    endingCount: recurringCondition.endingCount ?? undefined,
                    endDate: recurringCondition.endDate ? utcToKorea(recurringCondition.endDate.toISOString()) : undefined,
                })
                // await this.prisma.recurringCondition.create({
                //     data: {
                //         name: recurringCondition.name,
                //         tankId: targetTankId,
                //         intervalType: recurringCondition.intervalType,
                //         intervalValue: recurringCondition.intervalValue,
                //         message: recurringCondition.message,
                //         endingCount: recurringCondition.endingCount,
                //         endDate: recurringCondition.endDate,
                //         totalMessageSent: 0,
                //         lastMessageSent: new Date()
                //     }
                // });
            }
            else if (type === 'FEED_INCREASE') {
                const feedIncreaseCondition = await this.prisma.feedIncreaseCondition.findUnique({ where: { id: conditionId } });
                if (feedIncreaseCondition?.tankId == targetTankId) {
                    throw new HttpException('Cannot copy condition to the same tank', 400);
                }
                if (!feedIncreaseCondition) {
                    throw new NotFoundException('Feed Increase Condition not found');
                }
                await this.prisma.feedIncreaseCondition.create({
                    data: {
                        name: feedIncreaseCondition.name,
                        tankId: targetTankId,
                        dailyMessageSentCount: 0,
                        referenceTime: feedIncreaseCondition.referenceTime,
                        expectedFeedAmount: feedIncreaseCondition.expectedFeedAmount,
                        totalMessageSent: 0,
                        // lastMessageSent: new Date()
                    }
                });
            }
            return { message: "Conditions copied successfully" };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
}
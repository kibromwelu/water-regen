import {
    Injectable,
    BadRequestException,
    NotFoundException,
    HttpException,
} from '@nestjs/common';

import { subHours } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFeedIncreaseConditionDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { FeedIncreaseConditionResponse } from './response';
import { getKoreaDate, koreaToUtc, utcToKorea } from 'src/common/utils';
import { ConditionData } from 'src/condition/response';

@Injectable()
export class FeedIncreaseConditionService {
    constructor(private prisma: PrismaService) { }

    async createFeedIncreaseCondition(
        dto: CreateFeedIncreaseConditionDto,
    ): Promise<ConditionData> {
        try {
            const { name, tankId, referenceTime } = dto;
            console.log(referenceTime);
            //  Ensure no existing condition for this tank
            const existingCondition =
                await this.prisma.feedIncreaseCondition.findUnique({
                    where: { tankId },
                });

            if (existingCondition) {
                throw new BadRequestException(
                    'There is already an associated condition for this tank',
                );
            }

            const tank = await this.prisma.tank.findUnique({
                where: { id: tankId },
            });
            if (!tank) throw new NotFoundException('Tank not found');

            //  Compute daily expected feed amount based on previous 24 hours
            // const refHour = parseInt(referenceTime);
            const now = new Date();
            let koreanTime = utcToKorea(now.toString());
            console.log("Korean Time:", koreanTime)
            // let ;
            let refDateTime = koreaToUtc(getKoreaDate(koreanTime), referenceTime)
            // const refDateTime = new Date(
            //     now.getFullYear(),
            //     now.getMonth(),
            //     now.getDate(),
            //     refHour,
            //     0,
            //     0,
            // );
            console.log("Reference DateTime:", refDateTime);
            // Fetch records within 24 hours before reference time
            const startTime = subHours(refDateTime, 24);

            const previousFeedRecords = await this.prisma.feedingData.findMany({
                where: {
                    husbandryData: { tankId },
                    createdAt: { gte: startTime, lt: refDateTime },
                }
            });

            let dailyExpectedFeedAmount = 0;

            if (previousFeedRecords.length > 0) {
                const amounts = previousFeedRecords.map((r) => r.amount);
                const totalOfRecords = amounts.reduce((a, b) => a + b, 0);
                const maxAmount = Math.max(...amounts);
                dailyExpectedFeedAmount = Math.max(totalOfRecords, 4 * maxAmount);
            }
            dailyExpectedFeedAmount = dailyExpectedFeedAmount + 0.1 * dailyExpectedFeedAmount

            //  Create the condition
            const condition = await this.prisma.feedIncreaseCondition.create({
                data: {
                    name,
                    tankId,
                    referenceTime,
                    expectedFeedAmount: dailyExpectedFeedAmount,
                    dailyMessageSentCount: 0,
                    totalMessageSent: 0,
                },
            });

            return { 
                id: condition.id,
                name: condition.name
             };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }

    async updateFeedIncreaseCondition(id: string, dto: CreateFeedIncreaseConditionDto): Promise<ConditionData> {
        try {
            const { name, tankId, referenceTime } = dto;

            // 1️⃣ Ensure condition exists
            const existingCondition =
                await this.prisma.feedIncreaseCondition.findUnique({
                    where: { id },
                });

            if (!existingCondition) {
                throw new NotFoundException("Condition not found");
            }

            // 2️⃣ Ensure tank exists
            const tank = await this.prisma.tank.findUnique({
                where: { id: tankId },
            });
            if (!tank) throw new NotFoundException('Tank not found');

            // 3️⃣ Compute daily expected feed amount based on previous 24 hours
            const refHour = parseInt(referenceTime);
            const now = new Date();

            // Go back to the last reference time (approximate)
            const refDateTime = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                refHour,
                0,
                0,
            );

            // Fetch records within 24 hours before reference time
            const startTime = subHours(refDateTime, 24);

            const previousFeedRecords = await this.prisma.feedingData.findMany({
                where: {
                    husbandryData: { tankId },
                    createdAt: { gte: startTime, lt: refDateTime },
                }
            });

            let dailyExpectedFeedAmount = 0;

            if (previousFeedRecords.length > 0) {
                const amounts = previousFeedRecords.map((r) => r.amount);
                const totalOfRecords = amounts.reduce((a, b) => a + b, 0);
                const maxAmount = Math.max(...amounts);
                dailyExpectedFeedAmount = Math.max(totalOfRecords, 4 * maxAmount);
            }
            dailyExpectedFeedAmount = dailyExpectedFeedAmount + 0.1 * dailyExpectedFeedAmount

            // 4️⃣ Create the condition
            const condition = await this.prisma.feedIncreaseCondition.update({
                where: { id },
                data: {
                    name,
                    tankId,
                    referenceTime,
                    expectedFeedAmount: dailyExpectedFeedAmount,
                },
            });

            return { 
                id: condition.id,
                name: condition.name
             };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async getFeedIncreaseCondition(id: string, userId: string): Promise<FeedIncreaseConditionResponse> {
        try {
            let feedIncreaseCondition = await this.prisma.feedIncreaseCondition.findUnique({ where: { id, tank: { userId } }, include: { tank: true } })
            if (!feedIncreaseCondition) {
                throw new NotFoundException("Condition not found")
            }
            return {
                id: feedIncreaseCondition.id,
                name: feedIncreaseCondition.name,
                referenceTime: feedIncreaseCondition.referenceTime,
                tank: { id: feedIncreaseCondition.tank.id, name: feedIncreaseCondition.tank.name }
            }
        } catch (error) {
            throw new HttpException(error.message, error.status || 500)
        }
    }
    async deleteFeedIncrease(id: string): Promise<MessageResponse> {
        try {
            let condition = await this.prisma.feedIncreaseCondition.findUnique({ where: { id } });
            if (!condition) {
                throw new NotFoundException("Condition not found");
            }
            await this.prisma.feedIncreaseCondition.delete({ where: { id } })
            return {
                message: "Condition deleted successfully"
            }
        } catch (error) {
            throw new HttpException(error.message, error.status || 500)
        }
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { getKoreaHour, utcToKorea } from 'src/common/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CronService {
    // private readonly logger = new Logger(CronService.name);

    constructor(private prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async checkFeedingAlerts() {
        const currentHour = new Date()
        let currentKoreaTime = utcToKorea(currentHour.toString())
        let currentKoreaHour = getKoreaHour(currentKoreaTime);
        console.log("Current Korea Hour:", currentKoreaHour);
        const feedConditions = await this.prisma.feedIncreaseCondition.findMany({
            include: { tank: true },
        });
        console.log("Feeding conditions: ", feedConditions.length);

        for (const feed of feedConditions) {
            const refHour = parseInt(feed.referenceTime);
            const interval = 6;
            console.log("Feed referece time: ", refHour)
            const feedingHours = [
                refHour,
                (refHour + interval) % 24,
                (refHour + 2 * interval) % 24,
                (refHour + 3 * interval) % 24,
            ];
            console.log("Feeding hours:", feedingHours);
            let updatedFeed;
            if (currentKoreaHour === refHour) {
                console.log(currentKoreaHour, "is reference hour. Skipping increase logic.");
                const yesterdayStart = startOfDay(subDays(new Date(), 1));
                const yesterdayEnd = endOfDay(subDays(new Date(), 1));

                // Sum up all feed records for yesterday for this tank
                let actualUsedYesterday = 0;
                const feedRecords = await this.prisma.feedingData.findMany({
                    where: {
                        husbandryData: {
                            tankId: feed.tankId,
                        },
                        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
                    },
                });

                actualUsedYesterday = feedRecords.reduce((sum, record) => sum + record.amount, 0);

                let newFeedAmount = feed.expectedFeedAmount || 0;

                // --- 10% increase logic ---
                if (actualUsedYesterday > feed.expectedFeedAmount) {
                    newFeedAmount = actualUsedYesterday * 1.1;

                } else {
                    newFeedAmount = feed.expectedFeedAmount * 1.1;
                }

                updatedFeed = await this.prisma.feedIncreaseCondition.update({
                    where: { id: feed.id },
                    data: {
                        expectedFeedAmount: newFeedAmount,
                        dailyMessageSentCount: 0,
                        lastMessageSent: new Date(),
                    },
                });

                continue; // move to next tank
            }

            // --- 2️⃣ Handle feeding alert times ---
            if (feedingHours.includes(currentKoreaHour)) {
                // Prevent duplicate alerts within the same hour
                let lastMessageSentInKoreaHour;
                if (feed.lastMessageSent) {
                    lastMessageSentInKoreaHour = utcToKorea(feed.lastMessageSent?.toString());
                }
                console.log("Last message sent hour:", lastMessageSentInKoreaHour);
                let lastMessageSentHour;
                if (lastMessageSentInKoreaHour) {
                    lastMessageSentHour = getKoreaHour(lastMessageSentInKoreaHour);
                }
                if (
                    !feed.lastMessageSent ||
                    lastMessageSentHour !== currentKoreaHour
                ) {
                    await this.prisma.feedIncreaseCondition.update({
                        where: { id: feed.id },
                        data: {
                            // dailyMessageSentCount: { increment: 1 },
                            // totalMessageSent: { increment: 1 },
                            lastMessageSent: new Date(),
                        },
                    });

                    const feedPerTime = updatedFeed.expectedFeedAmount / 4;
                    console.log("feed per time:", feedPerTime);
                    await this.createTodo(feed.tankId, feed.tank.name, feedPerTime);
                }
            }
        }
    }

    async createTodo(tankId: string, tankName: string, feedPerTime: number) {
        try {
            await this.prisma.todo.create({
                data: {
                    tankId: tankId,
                    type: 'FEEDING_INCREASE',
                    message: `Feeding Alert: Please feed approximately ${feedPerTime.toFixed(2)} units to Tank "${tankName}".`,
                    createdAt: new Date(),
                }
            })
        } catch (error) {
            console.log("Error creating todo:", error);
        }
    }
}

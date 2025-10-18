import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { getKoreaHour, utcToKorea } from 'src/common/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';
import { FcmService } from 'src/fcm/fcm.service';

@Injectable()
export class CronService {
  // private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private fcmService: FcmService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkFeedingAlerts() {
    const currentHour = new Date();
    let currentKoreaTime = utcToKorea(currentHour.toString());
    let currentKoreaHour = getKoreaHour(currentKoreaTime);
    console.log('Current Korea Hour:', currentKoreaHour);
    const feedConditions = await this.prisma.feedIncreaseCondition.findMany({
      include: { tank: true },
    });
    console.log('Feeding conditions: ', feedConditions.length);

    for (const feed of feedConditions) {
      const refHour = parseInt(feed.referenceTime);
      const interval = 6;
      console.log('Feed referece time: ', refHour);
      const feedingHours = [
        refHour,
        (refHour + interval) % 24,
        (refHour + 2 * interval) % 24,
        (refHour + 3 * interval) % 24,
      ];
      console.log('Feeding hours:', feedingHours);
      let updatedFeed;
      if (currentKoreaHour === refHour) {
        console.log(
          currentKoreaHour,
          'is reference hour. Skipping increase logic.',
        );
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

        actualUsedYesterday = feedRecords.reduce(
          (sum, record) => sum + record.amount,
          0,
        );

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
          lastMessageSentInKoreaHour = utcToKorea(
            feed.lastMessageSent?.toString(),
          );
        }
        console.log('Last message sent hour:', lastMessageSentInKoreaHour);
        let lastMessageSentHour;
        if (lastMessageSentInKoreaHour) {
          lastMessageSentHour = getKoreaHour(lastMessageSentInKoreaHour);
        }
        if (!feed.lastMessageSent || lastMessageSentHour !== currentKoreaHour) {
          const { newTodo, feedIncreaseCondition } =
            await this.prisma.$transaction(async (tx) => {
              const feedIncreaseCondition =
                await this.prisma.feedIncreaseCondition.update({
                  where: { id: feed.id },
                  data: {
                    // dailyMessageSentCount: { increment: 1 },
                    // totalMessageSent: { increment: 1 },
                    lastMessageSent: new Date(),
                  },
                });

              const feedPerTime = updatedFeed.expectedFeedAmount / 4;
              console.log('feed per time:', feedPerTime);
              //await this.createTodo(feed.tankId, feed.tank.name, feedPerTime);
              const newTodo = await tx.todo.create({
                data: {
                  tankId: feed.tankId,
                  type: 'FEEDING_INCREASE',
                  message: `Feeding Alert: Please feed approximately ${feedPerTime.toFixed(2)} units to Tank "${feed.tank.name}".`,
                  //createdAt: new Date(),
                },
                include: { tank: true },
              });
              return { feedIncreaseCondition, newTodo };
            });

          // Send FCM notification
          if (newTodo) {
            await this.fcmService.sendTodoNotification({
              userId: newTodo.tank.userId,
              tankId: newTodo.tankId,
              tankName: newTodo.tank.name,
              todoId: newTodo.id,
              message: newTodo.message,
              createdAt: newTodo.createdAt,
            });
          }
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
        },
      });
    } catch (error) {
      console.log('Error creating todo:', error);
    }
  }

  // Run every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleRecurringConditions() {
    const now = new Date();

    // Fetch all active recurring conditions
    const recurringConditions = await this.prisma.recurringCondition.findMany({
      include: {
        tank: true,
      },
    });

    for (const condition of recurringConditions) {
      const {
        id,
        tankId,
        name,
        intervalType,
        intervalValue,
        endDate,
        endingCount,
        lastMessageSent,
        totalMessageSent,
        message,
      } = condition;

      // Check stop conditions
      if (endDate && isAfter(now, endDate)) {
        console.log(`Condition ${id} expired due to endDate.`);
        continue;
      }

      if (endingCount && totalMessageSent >= endingCount) {
        console.log(`Condition ${id} reached ending count.`);
        continue;
      }

      // Calculate next trigger time
      let nextTrigger = new Date(lastMessageSent);
      switch (intervalType) {
        case 'DAYS':
          nextTrigger = addDays(lastMessageSent, intervalValue);
          break;
        case 'WEEKS':
          nextTrigger = addWeeks(lastMessageSent, intervalValue);
          break;
        case 'MONTHS':
          nextTrigger = addMonths(lastMessageSent, intervalValue);
          break;
        case 'YEARS':
          nextTrigger = addYears(lastMessageSent, intervalValue);
          break;
      }

      // Check if it's time to trigger
      if (isAfter(now, nextTrigger)) {
        const { todo, updatedRecurringCondition } =
          await this.prisma.$transaction(async (tx) => {
            // Create todo
            const todo = await tx.todo.create({
              data: {
                tankId,
                message,
                type: 'RECURRING',
              },
              include: { tank: true },
            });

            // Update recurring condition
            const updatedRecurringCondition =
              await tx.recurringCondition.update({
                where: { id },
                data: {
                  lastMessageSent: now,
                  totalMessageSent: { increment: 1 },
                },
              });

            return { todo, updatedRecurringCondition };
          });

        console.log(
          `Triggered recurring condition: ${name} for tank ${tankId}`,
        );

        // Send FCM notification
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
      }
    }
  }
}

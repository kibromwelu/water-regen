import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEstimatedHarvestDto, CreateHusbandryDataDto, GetEstimatedRecordDto, SensorDataDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageResponse } from 'src/common/response';
import { getKoreaHour, koreaToUtc, utcToKorea } from 'src/common/utils';
import { SensorType } from '@prisma/client';
import { FcmService } from 'src/fcm/fcm.service';
import { CreateEstimatedRecordResponse, GetEstimatedRecordResponse } from './response';
import { last } from 'rxjs';

@Injectable()
export class RecordService {

  constructor(
    private readonly prisma: PrismaService,
    private fcmService: FcmService,
  ) { }

  private async checkConditions(
    tankId: string,
    sensor: SensorType,
    value?: number,
  ): Promise<void> {
    if (value === undefined || value === null) return;

    const conditions = await this.prisma.condition.findMany({
      where: { tankId, sensor },
    });

    const operatorMap: Record<string, string> = {
      GT: '>',
      LT: '<',
      GTE: '>=',
      LTE: '<=',
      EQ: '==',
    };

    for (const cond of conditions) {
      const operator = operatorMap[cond.condition] || '==';
      if (eval(`${value} ${operator} ${cond.value}`)) {
        const todo = await this.prisma.todo.create({
          data: {
            tankId,
            message: cond.message,
            type: cond.type,
          },
          include: { tank: true },
        });

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

  async addHusbandryData(
    dto: CreateHusbandryDataDto,
  ): Promise<MessageResponse> {
    try {
      const {
        date,
        time,
        tankId,
        feedingInfo = [],
        supplementDosing = [],
      } = dto;
      const utcTime = koreaToUtc(date, time);

      const tank = await this.prisma.tank.findUnique({ where: { id: tankId } });
      if (!tank) throw new NotFoundException('Tank not found');

      // Check if husbandry record exists for the date
      const existingHusbandry = await this.prisma.husbandryData.findFirst({
        where: { tankId, date: utcTime },
      });

      let husbandryId: string;

      if (existingHusbandry) {
        const updated = await this.prisma.husbandryData.update({
          where: { id: existingHusbandry.id },
          data: {
            isClean: dto.isClean,
            ph: dto.ph,
            do: dto.do,
            nh4: dto.nh4,
            no2: dto.no2,
            alk: dto.alk,
            waterTemperature: dto.waterTemperature,
          },
        });
        husbandryId = updated.id;

        // Replace existing feeding/supplement data
        await Promise.all([
          feedingInfo.length
            ? this.prisma.feedingData.deleteMany({
              where: { husbandryDataId: husbandryId },
            })
            : null,
          supplementDosing.length
            ? this.prisma.supplementDosing.deleteMany({
              where: { husbandryDataId: husbandryId },
            })
            : null,
        ]);
      } else {
        const created = await this.prisma.husbandryData.create({
          data: {
            tankId,
            date: utcTime,
            isClean: dto.isClean,
            ph: dto.ph,
            do: dto.do,
            nh4: dto.nh4,
            no2: dto.no2,
            alk: dto.alk,
            waterTemperature: dto.waterTemperature,
          },
        });
        husbandryId = created.id;
      }

      // Insert new feeding/supplement data
      await Promise.all([
        feedingInfo.length
          ? this.prisma.feedingData.createMany({
            data: feedingInfo.map((feed) => ({
              husbandryDataId: husbandryId,
              type: feed.type,
              amount: feed.amount,
            })),
          })
          : null,
        supplementDosing.length
          ? this.prisma.supplementDosing.createMany({
            data: supplementDosing.map((supp) => ({
              husbandryDataId: husbandryId,
              name: supp.name,
              dosage: supp.dosage,
            })),
          })
          : null,
      ]);

      // Run condition checks concurrently
      await Promise.all([
        this.checkConditions(tankId, 'DO', dto.do),
        this.checkConditions(tankId, 'WATER_TEMPERATURE', dto.waterTemperature),
        this.checkConditions(tankId, 'PH', dto.ph),
        this.checkConditions(tankId, 'NH4', dto.nh4),
        this.checkConditions(tankId, 'NO2', dto.no2),
        this.checkConditions(tankId, 'ALK', dto.alk),
      ]);

      return { message: 'Husbandry data added successfully.' };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async addSensorHusbandryData(dto: SensorDataDto): Promise<MessageResponse> {
    try {
      let { tankerId, date, ...sensorData } = dto;
      let tank = await this.prisma.tank.findUnique({ where: { tankerId } });
      if (!tank) {
        throw new HttpException('Tank not found', 404);
      }
      let tankId = tank.id;
      let existingHusbandry = await this.prisma.husbandryData.findFirst({
        where: { tankId: tank.id, date },
      });
      if (existingHusbandry) {
        let husbandry = await this.prisma.husbandryData.update({
          where: { id: existingHusbandry.id },
          data: {
            ph: existingHusbandry.ph ?? sensorData.ph,
            do: existingHusbandry.do ?? sensorData.do,
            nh4: existingHusbandry.nh4 ?? sensorData.nh4,
            no2: existingHusbandry.no2 ?? sensorData.no2,
            waterTemperature:
              existingHusbandry.waterTemperature ?? sensorData.waterTemperature,
            alk: existingHusbandry.alk ?? sensorData.alk,
          },
        });

        await Promise.all([
          husbandry.do && existingHusbandry.do != husbandry.do
            ? this.checkConditions(tankId, 'DO', husbandry.do)
            : null,
          husbandry.waterTemperature &&
            existingHusbandry.waterTemperature != husbandry.waterTemperature
            ? this.checkConditions(
              tankId,
              'WATER_TEMPERATURE',
              husbandry.waterTemperature,
            )
            : null,
          husbandry.ph && existingHusbandry.ph != husbandry.ph
            ? this.checkConditions(tankId, 'PH', husbandry.ph)
            : null,
          husbandry.nh4 && existingHusbandry.nh4 != husbandry.nh4
            ? this.checkConditions(tankId, 'NH4', husbandry.nh4)
            : null,
          husbandry.no2 && existingHusbandry.no2 != husbandry.no2
            ? this.checkConditions(tankId, 'NO2', husbandry.no2)
            : null,
          husbandry.alk && existingHusbandry.alk != husbandry.alk
            ? this.checkConditions(tankId, 'ALK', husbandry.alk)
            : null,
        ]);
      } else {
        let husbandry = await this.prisma.husbandryData.create({
          data: {
            tankId: tank.id,
            date: date,
            ph: sensorData.ph,
            do: sensorData.do,
            nh4: sensorData.nh4,
            no2: sensorData.no2,
            waterTemperature: sensorData.waterTemperature,
            alk: sensorData.alk,
          },
        });
        await Promise.all([
          this.checkConditions(tankId, 'DO', dto.do),
          this.checkConditions(
            tankId,
            'WATER_TEMPERATURE',
            dto.waterTemperature,
          ),
          this.checkConditions(tankId, 'PH', dto.ph),
          this.checkConditions(tankId, 'NH4', dto.nh4),
          this.checkConditions(tankId, 'NO2', dto.no2),
          this.checkConditions(tankId, 'ALK', dto.alk),
        ]);
      }

      return { message: 'husbandry data added successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
  async getEstimatedHarvestRecord(dto: GetEstimatedRecordDto): Promise<GetEstimatedRecordResponse> {
    try {
      let { tankId, startDate, endDate, time } = dto;
      let beginningDate, lastDate;
      let tank = await this.prisma.tank.findUnique({ where: { id: tankId } });
      if (!tank) {
        throw new HttpException('Tank not found', 404);
      }
      if (startDate) {
        let utcStartDate = koreaToUtc(startDate, "00:00");
        beginningDate = utcStartDate;
      } else {
        beginningDate = new Date(new Date().setDate(new Date().getDate() - 7));
        beginningDate.setUTCHours(0, 0, 0, 0)
      }
      if (endDate) {
        let utcEndDate = koreaToUtc(endDate, time);
        lastDate = utcEndDate;
      } else {
        lastDate = new Date();
      }
      console.log("Beginning date:", beginningDate, "Last date:", lastDate);
      let record = await this.prisma.record.findFirst({ where: { tankId }, orderBy: { createdAt: 'desc' } });
      let feeds = await this.prisma.husbandryData.findMany({
        where: { tankId, date: { gte: beginningDate, lte: lastDate } },
        include: { feedingData: true, supplementDosing: true }
      })

      let feedAdded = feeds.reduce((sum, feed) => {
        let dailyFeed = feed.feedingData.reduce((feedSum, f) => feedSum + f.amount, 0);
        return sum + dailyFeed;
      }, 0);

      return {
        tankId: tankId,
        startDate: utcToKorea(beginningDate),
        endDate: utcToKorea(lastDate),
        time: time ?? getKoreaHour(utcToKorea(lastDate)),
        averageBodyWeight: record?.averageBodyWeight ?? tank.averageBodyWeight,
        lastShrimpWeight: record?.estimatedHarvest ?? tank.numberStocked * tank.averageBodyWeight / 1000,
        feedAdded: feedAdded / 1000,
        // fcr:  0,
      }
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async calculateEstimatedHarvest(dto: CreateEstimatedHarvestDto): Promise<CreateEstimatedRecordResponse> {
    try {
      let { tankId, lastShrimpWeight, averageBodyWeight, feedAdded, fcr, endDate, startDate, time } = dto
      let estimatedHarvest = lastShrimpWeight + (feedAdded / fcr);
      let estimatedCount = Math.round((estimatedHarvest * 1000) / averageBodyWeight);
      let record = await this.prisma.record.create({
        data: {
          tankId,
          shrimpWeight: lastShrimpWeight,
          averageBodyWeight,
          feedAdded,
          fcr,
          estimatedHarvest,
          estimatedCount,
          startDate: koreaToUtc(startDate, "00:00"),
          endDate: koreaToUtc(endDate, time),
        }
      })
      console.log("Record created:", record);
      return {
        estimatedCount,
        estimatedHarvest
      }
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}



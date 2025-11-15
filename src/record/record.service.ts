import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateEstimatedHarvestDto,
  CreateHusbandryDataDto,
  GetEstimatedRecordDto,
  SensorDataDto,
} from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageResponse } from 'src/common/response';
import {
  getKoreaDate,
  getKoreaHour,
  getRealId,
  koreaToUtc,
  utcToKorea,
} from 'src/common/utils';
import { SensorType } from '@prisma/client';
import { FcmService } from 'src/fcm/fcm.service';
import {
  CreateEstimatedRecordResponse,
  GetEstimatedRecordResponse,
} from './response';

@Injectable()
export class RecordService {
  constructor(
    private readonly prisma: PrismaService,
    private fcmService: FcmService,
  ) {}

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
    userId: string,
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

      const tank = await this.prisma.tank.findUnique({
        where: { id: tankId, userId },
      });
      if (!tank) throw new NotFoundException('Tank not found');

      // if date is before tank creation date, throw error
      if (new Date(utcTime) < tank.createdAt) {
        throw new HttpException(
          'Husbandry date cannot be before tank creation date',
          400,
        );
      }

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
      let dbTankerId = getRealId(tankerId);
      let tank = await this.prisma.tank.findUnique({
        where: { tankerId: dbTankerId },
      });
      if (!tank) {
        throw new HttpException('Tank not found', 404);
      }
      // if date is before tank creation date, throw error
      if (date < tank.createdAt) {
        throw new HttpException(
          'Date cannot be before tank creation date',
          400,
        );
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

      return { message: 'Sensor data added successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getEstimatedHarvestRecord(
    dto: GetEstimatedRecordDto,
    userId: string,
  ): Promise<GetEstimatedRecordResponse> {
    try {
      let { tankId, startDate, endDate, time } = dto;
      let beginningDate: Date;
      let lastDate: Date;
      
      let tank = await this.prisma.tank.findUnique({
        where: { id: tankId, userId },
      });
      if (!tank) {
        throw new HttpException('Tank not found', 404);
      }
      if (startDate && endDate) {
        let utcStartDate = koreaToUtc(startDate, '00:00');
        beginningDate = new Date(utcStartDate);
        let utcEndDate = koreaToUtc(endDate, time ?? '23:59:59.999');
        lastDate = new Date(utcEndDate);
      } else if (startDate && !endDate) {
        beginningDate = new Date(koreaToUtc(startDate));
        let nowDate = new Date().toISOString();
        let koreaNowDate = getKoreaDate(utcToKorea(nowDate));
        let koreaHour = getKoreaHour(utcToKorea(nowDate));
        
        if(new Date(startDate).getTime() === new Date(koreaNowDate).getTime()){
          lastDate = new Date(koreaToUtc(startDate, koreaHour.toString().padStart(2, '0')));
        }else{
          lastDate = new Date(koreaToUtc(startDate, '23:59:59.999'));
        }
        
      } else {
        let now = new Date().toISOString();
        let nowDate = getKoreaDate(utcToKorea(now));
        beginningDate = new Date(koreaToUtc(nowDate));
        beginningDate.setDate(beginningDate.getDate() - 6);
        lastDate = new Date();
      }

      if (beginningDate < tank.createdAt) {
        beginningDate = tank.createdAt;
      }
      if (lastDate < tank.createdAt) {
        throw new HttpException(
          'Date range cannot be before tank creation date',
          400,
        );
      }
      if (beginningDate > lastDate) {
        throw new HttpException('Start date cannot be after end date', 400);
      }
      
      let record = await this.prisma.record.findFirst({
        where: { tankId },
        orderBy: { createdAt: 'desc' },
      });
      let feeds = await this.prisma.husbandryData.findMany({
        where: { tankId, date: { gte: beginningDate, lte: lastDate } },
        include: { feedingData: true, supplementDosing: true },
      });

      let feedAdded = feeds.reduce((sum, feed) => {
        let dailyFeed = feed.feedingData.reduce(
          (feedSum, f) => feedSum + f.amount,
          0,
        );
        return sum + dailyFeed;
      }, 0);

      let koreaStartDate = getKoreaDate(utcToKorea(beginningDate.toISOString()))
      let koreaEndDate = getKoreaDate(utcToKorea(lastDate.toISOString()))
      return {
        tankId: tankId,
        startDate: koreaStartDate,
        endDate: koreaEndDate == koreaStartDate? null: koreaEndDate,
        time:
          time ??
          getKoreaHour(utcToKorea(lastDate.toISOString()))
            .toString()
            .padStart(2, '0'),
        averageBodyWeight: record?.averageBodyWeight ?? tank.averageBodyWeight,
        lastShrimpWeight:
          record?.estimatedHarvest ??
          (tank.numberStocked * tank.averageBodyWeight) / 1000,
        feedAdded: feedAdded,
        doc: endDate // if given endDate, calculate doc from creating to endDate
          ? Math.floor(
              (lastDate.getTime() - new Date(tank.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : startDate // if only startDate given, calculate doc from creating to startDate
            ? Math.floor(
                (beginningDate.getTime() - new Date(tank.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : Math.floor( // if no date given, calculate doc from creating to today
                (lastDate.getTime() - new Date(tank.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async calculateEstimatedHarvest(
    dto: CreateEstimatedHarvestDto,
    userId: string,
  ): Promise<CreateEstimatedRecordResponse> {
    try {
      let beginningDate, lastDate;
      let {
        tankId,
        lastShrimpWeight,
        averageBodyWeight,
        feedAdded,
        fcr,
        endDate,
        startDate,
        time,
      } = dto;
      let tank = await this.prisma.tank.findUnique({
        where: { id: tankId, userId },
      });
      if (!tank) {
        throw new HttpException('Tank not found', 404);
      }

      if (startDate) {
        let utcStartDate = koreaToUtc(startDate, '00:00');
        beginningDate = utcStartDate;
      } else {
        let now = new Date().toISOString();
        let nowDate = getKoreaDate(utcToKorea(now));
        beginningDate = new Date(koreaToUtc(nowDate));
        beginningDate.setDate(beginningDate.getDate() - 7);
      }
      if (endDate) {
        let utcEndDate = koreaToUtc(endDate, time);
        lastDate = utcEndDate;
      } else {
        lastDate = new Date();
      }

      if (beginningDate < tank.createdAt || lastDate < tank.createdAt) {
        throw new HttpException(
          'Date range cannot be before tank creation date',
          400,
        );
      }

      let feedAddedInKg = feedAdded / 1000;
      let estimatedHarvest = lastShrimpWeight + feedAddedInKg / fcr;
      let estimatedCount = Math.round(
        (estimatedHarvest * 1000) / averageBodyWeight,
      );
      let record = await this.prisma.record.create({
        data: {
          tankId,
          shrimpWeight: lastShrimpWeight,
          averageBodyWeight,
          feedAdded,
          fcr,
          estimatedHarvest,
          estimatedCount,
          startDate: koreaToUtc(startDate, '00:00'),
          endDate: koreaToUtc(endDate, time),
        },
      });
      
      return {
        estimatedCount,
        estimatedHarvest,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}

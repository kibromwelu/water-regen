import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetHomeDto } from './dto';
import {
  getKoreaDate,
  getKoreaDay,
  getKoreaHour,
  koreaToUtc,
  utcToKorea,
} from 'src/common/utils';
import { MessageResponse } from 'src/common/response';
import { GetHomeResponse } from './response';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { FcmService } from 'src/fcm/fcm.service';

dayjs.extend(utc);
dayjs.extend(timezone);

const KST = 'Asia/Seoul';

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private fcmService: FcmService,
  ) {}

  async getHome(userId: string, dto: GetHomeDto): Promise<GetHomeResponse> {
    try {
      let tankId: string;
      let startDate: Date;
      let endDate: Date;
      let todoList: any;
      let summaryData: any[];
      let tankCreationAt: Date;
      let averageBodyWeight: number;
      let todayLastHour: number = 0;

      // Helper function to round to 2 decimal places
      const roundToFloat = (value: number) => Math.round(value * 100) / 100;

      // Date handling
      if (dto.startDate && dto.endDate) {
        if (dto.isHourlyView) {
          // only for one day
          // choose the starting date for today
          let now = new Date();
          dto.startDate = getKoreaDate(utcToKorea(now.toISOString()));
          const normalizedDate = dto.startDate.replace(/\./g, '-');
          startDate = new Date(koreaToUtc(normalizedDate));
          endDate = new Date(koreaToUtc(normalizedDate, '23:59:59.999'));
          dto.endDate = undefined;
        } else {
          startDate = new Date(koreaToUtc(dto.startDate));
          const normalizedDate = dto.endDate.replace(/\./g, '-');
          endDate = new Date(koreaToUtc(normalizedDate, '23:59:59.999'));
        }
      } else if (dto.startDate && !dto.endDate) {
        // set isHourlyView to true if only startDate is provided
        //dto.isHourlyView = true;
        // only for one day
        startDate = new Date(koreaToUtc(dto.startDate));

        //const normalizedDate = dto.startDate.replace(/\./g, '-');
        endDate = new Date(koreaToUtc(dto.startDate, '23:59:59.999'));
      } else {
        if (dto.isHourlyView) {
          // only for one day
          let now = new Date();
          dto.startDate = getKoreaDate(utcToKorea(now.toISOString()));
          const normalizedDate = dto.startDate.replace(/\./g, '-');
          startDate = new Date(koreaToUtc(normalizedDate));
          endDate = now;
        } else {
          let now = new Date();
          let nowDate = getKoreaDate(utcToKorea(now.toISOString()));
          let normalizedDate = nowDate.replace(/\./g, '-');
          startDate = new Date(koreaToUtc(normalizedDate));
          endDate = now;

          startDate.setDate(startDate.getDate() - 6); // default to last 6 days
          dto.startDate = getKoreaDate(utcToKorea(startDate.toISOString()));
          dto.endDate = getKoreaDate(utcToKorea(endDate.toISOString()));
        }
      }

      // Get todo list
      todoList = await this.prisma.todo.findMany({
        where: {
          tank: {
            userId: userId,
          },
        },
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Get tank data
      if (dto.tankId) {
        const tank = await this.prisma.tank.findFirst({
          where: {
            id: dto.tankId,
            userId: userId,
          },
        });
        if (!tank) {
          throw new NotFoundException('Tank not found');
        }
        tankId = dto.tankId;
        tankCreationAt = tank.createdAt;
        averageBodyWeight = tank.averageBodyWeight;
      } else {
        const tanks = await this.prisma.tank.findMany({
          where: {
            userId: userId,
          },
        });
        if (tanks.length === 0) {
          return {
            tankId: null,
            totalTodo: 0,
            todo: [],
            data: [],
            startDate: dto.startDate,
            endDate: dto.endDate ? dto.endDate : null,
            isHourlyView: dto.isHourlyView ? true : false,
            doc: 0,
            AverageBodyWeight: 0,
          };
        }
        tankId = tanks[0].id;
        tankCreationAt = tanks[0].createdAt;
        averageBodyWeight = tanks[0].averageBodyWeight;
      }

      // if endDate is before tankCreationAt, set endDate to tankCreationAt
      if (endDate < tankCreationAt) {
        if (dto.isHourlyView) {
          // only for one day
          let now = new Date();
          dto.startDate = getKoreaDate(utcToKorea(now.toISOString()));
          const normalizedDate = dto.startDate.replace(/\./g, '-');
          startDate = new Date(koreaToUtc(normalizedDate));
          endDate = now; //new Date(koreaToUtc(normalizedDate, '23:59:59.999'));
          dto.endDate = undefined;
        } else {
          let now = new Date();
          let nowDate = getKoreaDate(utcToKorea(now.toISOString()));
          let normalizedDate = nowDate.replace(/\./g, '-');
          startDate = new Date(koreaToUtc(normalizedDate));
          endDate = now;

          startDate.setDate(startDate.getDate() - 6); // default to last 6 days
          dto.startDate = getKoreaDate(utcToKorea(startDate.toISOString()));
          dto.endDate = getKoreaDate(utcToKorea(endDate.toISOString()));
        }
      }
      // if the startDate is before tankCreationAt, set startDate to tankCreationAt
      if (startDate < tankCreationAt) {
        startDate = tankCreationAt;
        dto.startDate = getKoreaDate(utcToKorea(tankCreationAt.toISOString()));
      }

      // // if the startDate and endDate are the same day, set isHourlyView to true
      // if(dto.startDate === dto.endDate){
      //   dto.isHourlyView = true;
      // }

      // Adjust todayLastHour for hourly view
      if (dto.isHourlyView) {
        let now = new Date().toISOString();
        let nowDate = getKoreaDate(utcToKorea(now));
        if (nowDate == dto.startDate) {
          todayLastHour = getKoreaHour(utcToKorea(now));
        }
      }

      // Get husbandry data
      const getHusbandryData = await this.prisma.husbandryData.findMany({
        where: {
          tankId: tankId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          tankId: true,
          date: true,
          ph: true,
          do: true,
          alk: true,
          nh4: true,
          no2: true,
          waterTemperature: true,
          feedingData: true,
          supplementDosing: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Transform the data to include date and time in KST
      const husbandryDataSummary = getHusbandryData.map((data) => ({
        date: getKoreaDate(utcToKorea(data.date.toISOString())),
        time: getKoreaHour(utcToKorea(data.date.toISOString())),
        ph: data.ph,
        do: data.do,
        alk: data.alk,
        nh4: data.nh4,
        no2: data.no2,
        waterTemperature: data.waterTemperature,
        feedingData: data.feedingData,
        supplementDosing: data.supplementDosing,
      }));

      // Generate all dates or hours
      if (dto.isHourlyView) {
        // Generate all hours (0–23) for the single day
        const normalizedDate = dto.startDate.replace(/\./g, '-');
        const allHours = Array.from(
          { length: todayLastHour ? todayLastHour + 1 : 24 },
          (_, i) => ({
            date: normalizedDate,
            time: i,
            ph: 0,
            do: 0,
            alk: 0,
            nh4: 0,
            no2: 0,
            waterTemperature: 0,
            feedingData: 0,
            supplementDosing: 0,
          }),
        );

        // Group by hour
        const groupedData = husbandryDataSummary.reduce(
          (acc, data) => {
            const key = data.time; // Group by hour
            if (!acc[key]) {
              acc[key] = {
                date: data.date,
                time: data.time,
                phCount: 0,
                doCount: 0,
                alkCount: 0,
                nh4Count: 0,
                no2Count: 0,
                temperatureCount: 0,
                ph: 0,
                do: 0,
                alk: 0,
                nh4: 0,
                no2: 0,
                waterTemperature: 0,
                feedingData: 0,
                supplementDosing: 0,
              };
            }
            acc[key].phCount += data.ph? 1:0;
            acc[key].doCount += data.do? 1:0;
            acc[key].alkCount += data.alk? 1:0;
            acc[key].nh4Count += data.nh4? 1:0;
            acc[key].no2Count += data.no2? 1:0;
            acc[key].temperatureCount += data.waterTemperature? 1:0;
            acc[key].ph += data.ph || 0;
            acc[key].do += data.do || 0;
            acc[key].alk += data.alk || 0;
            acc[key].nh4 += data.nh4 || 0;
            acc[key].no2 += data.no2 || 0;
            acc[key].waterTemperature += data.waterTemperature || 0;
            acc[key].feedingData +=
              data.feedingData?.reduce(
                (sum, item) => sum + (item.amount || 0),
                0,
              ) || 0;
            acc[key].supplementDosing +=
              data.supplementDosing?.reduce(
                (sum, item) => sum + (item.dosage || 0),
                0,
              ) || 0;
            return acc;
          },
          {} as Record<number, any>,
        );

        // Merge with all hours, filling in zeros for missing hours
        summaryData = allHours.map((hour) => ({
          date: hour.date,
          time: hour.time,
          ph:
            groupedData[hour.time]?.phCount > 0
              ? roundToFloat(
                  groupedData[hour.time].ph / groupedData[hour.time].phCount,
                )
              : 0,
          do:
            groupedData[hour.time]?.doCount > 0
              ? roundToFloat(
                  groupedData[hour.time].do / groupedData[hour.time].doCount,
                )
              : 0,
          alk:
            groupedData[hour.time]?.alkCount > 0
              ? roundToFloat(
                  groupedData[hour.time].alk / groupedData[hour.time].alkCount,
                )
              : 0,
          nh4:
            groupedData[hour.time]?.nh4Count > 0
              ? roundToFloat(
                  groupedData[hour.time].nh4 / groupedData[hour.time].nh4Count,
                )
              : 0,
          no2:
            groupedData[hour.time]?.no2Count > 0
              ? roundToFloat(
                  groupedData[hour.time].no2 / groupedData[hour.time].no2Count,
                )
              : 0,
          waterTemperature:
            groupedData[hour.time]?.temperatureCount > 0
              ? roundToFloat(
                  groupedData[hour.time].waterTemperature /
                    groupedData[hour.time].temperatureCount,
                )
              : 0,
          feedingData: roundToFloat(groupedData[hour.time]?.feedingData || 0),
          supplementDosing: roundToFloat(
            groupedData[hour.time]?.supplementDosing || 0,
          ),
        }));

        // Sort by time
        //summaryData.sort((a, b) => a.time - b.time);
      } else {
        // Generate all dates in range
        const start = dayjs.tz(dto.startDate.replace(/\./g, '-'), KST);
        const allDates: string[] = [];
        if (dto.endDate) {
          const end = dayjs.tz(dto.endDate.replace(/\./g, '-'), KST); // Non-null assertion
          for (
            let d = start;
            d.isBefore(end) || d.isSame(end, 'day');
            d = d.add(1, 'day')
          ) {
            allDates.push(d.format('YYYY-MM-DD'));
          }
        } else {
          allDates.push(start.format('YYYY-MM-DD'));
        }

        // Group by date
        const groupedData = husbandryDataSummary.reduce(
          (acc, data) => {
            const key = data.date; // Group by date
            if (!acc[key]) {
              acc[key] = {
                date: data.date,
                phCount: 0,
                doCount: 0,
                alkCount: 0,
                nh4Count: 0,
                no2Count: 0,
                temperatureCount: 0,
                ph: 0,
                do: 0,
                alk: 0,
                nh4: 0,
                no2: 0,
                waterTemperature: 0,
                feedingData: 0,
                supplementDosing: 0,
              };
            }
            acc[key].phCount += data.ph? 1:0;
            acc[key].doCount += data.do? 1:0;
            acc[key].alkCount += data.alk? 1:0;
            acc[key].nh4Count += data.nh4? 1:0;
            acc[key].no2Count += data.no2? 1:0;
            acc[key].temperatureCount += data.waterTemperature? 1:0;
            acc[key].ph += data.ph || 0;
            acc[key].do += data.do || 0;
            acc[key].alk += data.alk || 0;
            acc[key].nh4 += data.nh4 || 0;
            acc[key].no2 += data.no2 || 0;
            acc[key].waterTemperature += data.waterTemperature || 0;
            acc[key].feedingData +=
              data.feedingData?.reduce(
                (sum, item) => sum + (item.amount || 0),
                0,
              ) || 0;
            acc[key].supplementDosing +=
              data.supplementDosing?.reduce(
                (sum, item) => sum + (item.dosage || 0),
                0,
              ) || 0;
            return acc;
          },
          {} as Record<string, any>,
        );
        
        // Merge with all dates, filling in zeros for missing dates
        summaryData = allDates.map((date) => ({
          date,
          time: null,
          ph:
            groupedData[date]?.phCount > 0
              ? roundToFloat(groupedData[date].ph / groupedData[date].phCount)
              : 0,
          do:
            groupedData[date]?.doCount > 0
              ? roundToFloat(groupedData[date].do / groupedData[date].doCount)
              : 0,
          alk:
            groupedData[date]?.alkCount > 0
              ? roundToFloat(groupedData[date].alk / groupedData[date].alkCount)
              : 0,
          nh4:
            groupedData[date]?.nh4Count > 0
              ? roundToFloat(groupedData[date].nh4 / groupedData[date].nh4Count)
              : 0,
          no2:
            groupedData[date]?.no2Count > 0
              ? roundToFloat(groupedData[date].no2 / groupedData[date].no2Count)
              : 0,
          waterTemperature:
            groupedData[date]?.temperatureCount > 0
              ? roundToFloat(
                  groupedData[date].waterTemperature / groupedData[date].temperatureCount,
                )
              : 0,
          feedingData: roundToFloat(groupedData[date]?.feedingData || 0),
          supplementDosing: roundToFloat(
            groupedData[date]?.supplementDosing || 0,
          ),
        }));

        // Sort by date
        //summaryData.sort((a, b) => a.date.localeCompare(b.date));
      }

      // Get last record for AverageBodyWeight
      const lastRecord = await this.prisma.record.findFirst({
        where: {
          tankId: tankId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        tankId,
        totalTodo: todoList.length,
        todo: todoList,
        data: summaryData,
        startDate: dto.startDate,
        endDate: dto.endDate ? dto.endDate==dto.startDate? null: dto.endDate : null,
        isHourlyView: dto.isHourlyView ? true : false,
        doc: Math.floor(
          (new Date().getTime() - new Date(tankCreationAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        AverageBodyWeight: lastRecord?.averageBodyWeight ?? averageBodyWeight,
      };
    } catch (error) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async removeTodo(userId: string, id: string): Promise<MessageResponse> {
    try {
      const existingTodo = await this.prisma.todo.findUnique({
        where: { id: id, tank: { userId } },
        include: { tank: true },
      });
      if (!existingTodo) {
        throw new NotFoundException('Todo not found');
      }

      // delete todo
      await this.prisma.todo.delete({
        where: { id: id },
      });

      await this.fcmService.sendTodoNotification({
        userId: existingTodo.tank.userId,
        tankId: existingTodo.tankId,
        tankName: existingTodo.tank.name,
        todoId: existingTodo.id,
        message: existingTodo.message,
        createdAt: existingTodo.createdAt,
        deleted: true,
      });

      return {
        message: 'Todo has been deleted.',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }
}

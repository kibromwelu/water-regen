import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateHusbandryDataDto, SensorDataDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageResponse } from 'src/common/response';
import { koreaToUtc } from 'src/common/utils';
import { SensorType } from '@prisma/client';

@Injectable()
export class RecordService {
    constructor(private readonly prisma: PrismaService) { }

    private async checkConditions(tankId: string, sensor: SensorType, value?: number): Promise<void> {
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
                await this.prisma.todo.create({
                    data: {
                        tankId,
                        message: cond.message,
                        type: cond.type,
                    },
                });
            }
        }
    }

    async addHusbandryData(dto: CreateHusbandryDataDto): Promise<MessageResponse> {
        try {
            const { date, time, tankId, feedingInfo = [], supplementDosing = [] } = dto;
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
                        salinity: dto.salinity,
                        waterTemperature: dto.waterTemperature,
                    },
                });
                husbandryId = updated.id;

                // Replace existing feeding/supplement data
                await Promise.all([
                    this.prisma.feedingData.deleteMany({ where: { husbandryDataId: husbandryId } }),
                    this.prisma.supplementDosing.deleteMany({ where: { husbandryDataId: husbandryId } }),
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
                        salinity: dto.salinity,
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
            let existingHusbandry = await this.prisma.husbandryData.findFirst({ where: { tankId: tank.id, date } })
            if (existingHusbandry) {
                let husbandry = await this.prisma.husbandryData.update({
                    where: { id: existingHusbandry.id },
                    data: {
                        ph: existingHusbandry.ph ?? sensorData.ph,
                        do: existingHusbandry.do ?? sensorData.do,
                        nh4: existingHusbandry.nh4 ?? sensorData.nh4,
                        no2: existingHusbandry.no2 ?? sensorData.no2,
                        waterTemperature: existingHusbandry.waterTemperature ?? sensorData.waterTemperature,
                        alk: existingHusbandry.alk ?? sensorData.alk,
                        salinity: existingHusbandry.salinity ?? sensorData.salinity,
                    }
                })

                await Promise.all([
                    husbandry.do && existingHusbandry.do != husbandry.do ? this.checkConditions(tankId, 'DO', husbandry.do) : null,
                    husbandry.waterTemperature && existingHusbandry.waterTemperature != husbandry.waterTemperature ? this.checkConditions(tankId, 'WATER_TEMPERATURE', husbandry.waterTemperature) : null,
                    husbandry.ph && existingHusbandry.ph != husbandry.ph ? this.checkConditions(tankId, 'PH', husbandry.ph) : null,
                    husbandry.nh4 && existingHusbandry.nh4 != husbandry.nh4 ? this.checkConditions(tankId, 'NH4', husbandry.nh4) : null,
                    husbandry.no2 && existingHusbandry.no2 != husbandry.no2 ? this.checkConditions(tankId, 'NO2', husbandry.no2) : null,
                    husbandry.alk && existingHusbandry.alk != husbandry.alk ? this.checkConditions(tankId, 'ALK', husbandry.alk) : null,
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
                        salinity: sensorData.salinity,
                    }
                });
                await Promise.all([
                    this.checkConditions(tankId, 'DO', dto.do),
                    this.checkConditions(tankId, 'WATER_TEMPERATURE', dto.waterTemperature),
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
}

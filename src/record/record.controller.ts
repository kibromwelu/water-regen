import { Body, Controller, Post } from '@nestjs/common';
import { RecordService } from './record.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageResponse } from 'src/common/response';
import { CreateHusbandryDataDto, SensorDataDto } from './dto';

@Controller('record')
export class RecordController {
    constructor(private readonly recordService: RecordService) { }

    @Post('add-husbandry-data')
    @ApiResponse({ status: 201, description: 'Husbandry data added successfully.' })
    async addHusbandryData(@Body() dto: CreateHusbandryDataDto): Promise<MessageResponse> {
        return this.recordService.addHusbandryData(dto);
    }
    @Post('add-sensor-data')
    @ApiOperation({ summary: 'Add sensor data' })
    @ApiResponse({ status: 201, description: 'Sensor data added successfully.' })
    async addSensorData(@Body() dto: SensorDataDto): Promise<MessageResponse> {
        return this.recordService.addSensorHusbandryData(dto);
    }
}

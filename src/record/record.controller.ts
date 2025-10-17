import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RecordService } from './record.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageResponse } from 'src/common/response';
import { CreateHusbandryDataDto, SensorDataDto } from './dto';
import { JwtGuard } from 'src/common/guards';

@Controller('record')
@ApiBearerAuth()
@UseGuards(JwtGuard)
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

import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { RecordService } from './record.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageResponse } from 'src/common/response';
import { CreateEstimatedHarvestDto, CreateHusbandryDataDto, GetEstimatedRecordDto, SensorDataDto } from './dto';
import { JwtGuard } from 'src/common/guards';
import { CreateEstimatedRecordResponse, GetEstimatedRecordResponse } from './response';

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

    @Post('get-estimated-harvest')
    @ApiOperation({ summary: "Get estimated harvest record", description: "Retrieve estimated harvest records based on provided criteria." })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
    @ApiResponse({ status: 200, type: GetEstimatedRecordResponse, description: "Estimated harvest records retrieved successfully." })
    async getEstimatedHarvestRecord(@Body() dto: GetEstimatedRecordDto): Promise<GetEstimatedRecordResponse> {
        return this.recordService.getEstimatedHarvestRecord(dto);
    }

    @Post('calculate-estimated-harvest')
    @ApiOperation({ summary: 'Calculate estimated harvest', description: 'Calculate estimated harvest based on current data.' })
    @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
    @ApiResponse({ status: 200, type: CreateEstimatedRecordResponse, description: 'Estimated harvest calculated successfully.' })
    async calculateEstimatedHarvest(@Body() dto: CreateEstimatedHarvestDto): Promise<CreateEstimatedRecordResponse> {
        return this.recordService.calculateEstimatedHarvest(dto);
    }
}
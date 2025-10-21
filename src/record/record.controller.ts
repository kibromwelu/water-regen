import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { RecordService } from './record.service';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageResponse } from 'src/common/response';
import { CreateEstimatedHarvestDto, CreateHusbandryDataDto, GetEstimatedRecordDto, SensorDataDto } from './dto';
import { BasicAuthGuard, JwtGuard } from 'src/common/guards';
import { CreateEstimatedRecordResponse, GetEstimatedRecordResponse } from './response';

@Controller('record')
export class RecordController {
    constructor(private readonly recordService: RecordService) { }

    @Post('add-husbandry-data')
    @ApiBearerAuth()
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Add husbondry data' })
    @ApiResponse({ status: 201, description: 'Husbandry data added successfully.' })
    async addHusbandryData(@Body() dto: CreateHusbandryDataDto): Promise<MessageResponse> {
        return this.recordService.addHusbandryData(dto);
    }

    @Post('add-sensor-data')
    @ApiBasicAuth() 
    @UseGuards(BasicAuthGuard)
    @ApiOperation({ summary: 'Add sensor data' })
    @ApiResponse({ status: 201, description: 'Sensor data added successfully.' })
    async addSensorData(@Body() dto: SensorDataDto): Promise<MessageResponse> {
        return this.recordService.addSensorHusbandryData(dto);
    }

    @Post('get-estimated-harvest')
    @ApiBearerAuth()
    @UseGuards(JwtGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Get estimated harvest record", description: "Retrieve estimated harvest records based on provided criteria." })
    @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
    @ApiResponse({ status: 200, type: GetEstimatedRecordResponse, description: "Estimated harvest records retrieved successfully." })
    async getEstimatedHarvestRecord(@Body() dto: GetEstimatedRecordDto): Promise<GetEstimatedRecordResponse> {
        return this.recordService.getEstimatedHarvestRecord(dto);
    }

    @Post('calculate-estimated-harvest')
    @ApiBearerAuth()
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Calculate estimated harvest', description: 'Calculate estimated harvest based on current data.' })
    @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
    @ApiResponse({ status: 201, type: CreateEstimatedRecordResponse, description: 'Estimated harvest calculated successfully.' })
    async calculateEstimatedHarvest(@Body() dto: CreateEstimatedHarvestDto): Promise<CreateEstimatedRecordResponse> {
        return this.recordService.calculateEstimatedHarvest(dto);
    }
}
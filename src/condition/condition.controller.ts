import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ConditionService } from './condition.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConditionsListResponse, FeedingConditionDetailResponse } from './response';
import { AlertConditionDto, CreateFeedingConditionDto, UpdateFeedingConditionDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { JwtGuard } from 'src/common/guards';

@Controller('condition')
@ApiBearerAuth()
@UseGuards(JwtGuard)
export class ConditionController {
    constructor(private readonly conditionService: ConditionService) { }
    // common
    @Get('/all')
    @ApiOperation({ summary: 'Get all conditions' })
    @ApiResponse({ status: 200, type: ConditionsListResponse })
    async getAllConditions(): Promise<ConditionsListResponse> {
        try {
            return await this.conditionService.getAllConditions();
        } catch (error) {
            throw new Error('Method not implemented.');
        }
    }
    //section 1: Feeding condition
    @Get('/feeding-condition/:id')
    @ApiResponse({ status: 200, type: FeedingConditionDetailResponse })
    @ApiOperation({ summary: 'Get feeding condition by ID' })
    async getConditionDetail(@Param('id') id: string): Promise<FeedingConditionDetailResponse> {
        return this.conditionService.getFeedingConditionDetail(id);
    }
    @Post('/feeding-condition')
    @ApiOperation({ summary: 'Create feeding condition' })
    @ApiResponse({ status: 201, type: MessageResponse })
    async createFeedingCondition(@Body() dto: CreateFeedingConditionDto): Promise<MessageResponse> {
        return this.conditionService.createFeedingCondition(dto);
    }

    @Patch('/feeding-condition/:id')
    @ApiOperation({ summary: 'Update feeding condition by ID' })
    async updateFeedingCondition(@Param('id') id: string, @Body() dto: UpdateFeedingConditionDto): Promise<MessageResponse> {
        return this.conditionService.updateFeedingCondition(id, dto);
    }

    @Delete('/feeding-condition/:id')
    @ApiOperation({ summary: 'Delete feeding condition by ID' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async deleteFeedingCondition(@Param('id') id: string): Promise<MessageResponse> {
        return this.conditionService.deleteFeedingCondition(id);
    }

    // section 2: Alert condition
    @Get('/alert-condition/:id')
    @ApiOperation({ summary: 'Get alert condition by ID' })
    async getAlertConditionDetail(@Param('id') id: string) {
        return this.conditionService.getAlertConditionDetail(id);
    }
    @Post('/alert-condition')
    @ApiOperation({ summary: 'Create alert condition' })
    @ApiResponse({ status: 201, type: MessageResponse })
    async createAlertCondition(@Body() dto: AlertConditionDto) {
        return this.conditionService.createAlertCondition(dto);
    }
    @Patch('/alert-condition/:id')
    @ApiOperation({ summary: 'Update alert condition by ID' })
    async updateAlertCondition(@Param('id') id: string, @Body() dto: AlertConditionDto) {
        return this.conditionService.updateAlertCondition(id, dto);
    }
    @Delete('/alert-condition/:id')
    @ApiOperation({ summary: 'Delete alert condition by ID' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async deleteAlertCondition(@Param('id') id: string): Promise<MessageResponse> {
        return this.conditionService.deleteAlertCondition(id);
    }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ConditionService } from './condition.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConditionData, ConditionsListResponse, FeedingConditionDetailResponse } from './response';
import { AlertConditionDto, CreateFeedingConditionDto, UpdateFeedingConditionDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { JwtGuard } from 'src/common/guards';
import { CurrentUserId } from 'src/common/decorators';

@Controller('condition')
@ApiBearerAuth()
@UseGuards(JwtGuard)
export class ConditionController {
    constructor(private readonly conditionService: ConditionService) { }
    // common
    @Get('/all')
    @ApiOperation({ summary: 'Get all conditions' })
    @ApiResponse({ status: 200, type: ConditionsListResponse })
    async getAllConditions(@CurrentUserId() userId: string): Promise<ConditionsListResponse> {
        try {
            return await this.conditionService.getAllConditions(userId);
        } catch (error) {
            throw new Error('Method not implemented.');
        }
    }

    //section 1: Feeding condition
    @Get('/feeding-condition/:id')
    @ApiResponse({ status: 200, type: FeedingConditionDetailResponse })
    @ApiOperation({ summary: 'Get feeding condition by ID' })
    async getConditionDetail(@Param('id') id: string, @CurrentUserId() userId: string): Promise<FeedingConditionDetailResponse> {
        return this.conditionService.getFeedingConditionDetail(id, userId);
    }

    @Post('/feeding-condition')
    @ApiOperation({ summary: 'Create feeding condition' })
    @ApiResponse({ status: 201, type: ConditionData })
    async createFeedingCondition(@Body() dto: CreateFeedingConditionDto, @CurrentUserId() userId: string): Promise<ConditionData> {
        return this.conditionService.createFeedingCondition(dto, userId);
    }

    @Patch('/feeding-condition/:id')
    @ApiOperation({ summary: 'Update feeding condition by ID' })
    @ApiResponse({ status: 200, type: ConditionData })
    async updateFeedingCondition(@Param('id') id: string, @Body() dto: UpdateFeedingConditionDto, @CurrentUserId() userId: string): Promise<ConditionData> {
        return this.conditionService.updateFeedingCondition(id, dto, userId);
    }

    @Delete('/feeding-condition/:id')
    @ApiOperation({ summary: 'Delete feeding condition by ID' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async deleteFeedingCondition(@Param('id') id: string, @CurrentUserId() userId: string): Promise<MessageResponse> {
        return this.conditionService.deleteFeedingCondition(id, userId);
    }

    // section 2: Alert condition
    @Get('/alert-condition/:id')
    @ApiOperation({ summary: 'Get alert condition by ID' })
    async getAlertConditionDetail(@Param('id') id: string, @CurrentUserId() userId: string) {
        return this.conditionService.getAlertConditionDetail(id, userId);
    }

    @Post('/alert-condition')
    @ApiOperation({ summary: 'Create alert condition' })
    @ApiResponse({ status: 201, type: ConditionData })
    async createAlertCondition(@Body() dto: AlertConditionDto, @CurrentUserId() userId: string): Promise<ConditionData> {
        return this.conditionService.createAlertCondition(dto, userId);
    }

    @Patch('/alert-condition/:id')
    @ApiOperation({ summary: 'Update alert condition by ID' })
    @ApiResponse({ status: 200, type: ConditionData })
    async updateAlertCondition(@Param('id') id: string, @Body() dto: AlertConditionDto, @CurrentUserId() userId: string): Promise<ConditionData> {
        return this.conditionService.updateAlertCondition(id, dto, userId);
    }

    @Delete('/alert-condition/:id')
    @ApiOperation({ summary: 'Delete alert condition by ID' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async deleteAlertCondition(@Param('id') id: string, @CurrentUserId() userId: string): Promise<MessageResponse> {
        return this.conditionService.deleteAlertCondition(id, userId);
    }
}

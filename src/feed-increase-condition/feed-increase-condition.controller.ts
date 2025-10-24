import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FeedIncreaseConditionService } from './feed-increase-condition.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageResponse } from 'src/common/response';
import { CreateFeedIncreaseConditionDto } from './dto';
import { FeedIncreaseConditionResponse } from './response';
import { JwtGuard } from 'src/common/guards';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('feed-increase-condition')
@ApiBearerAuth()
@UseGuards(JwtGuard)
export class FeedIncreaseConditionController {
    constructor(private readonly feedIncreaseConditionService: FeedIncreaseConditionService) { }

    @Post('/create')
    @ApiOperation({ summary: 'Create feed increase condition' })
    @ApiResponse({ status: 201, description: 'Feed increase condition created successfully.' })
    async createFeedIncreaseCondition(@Body() dto: CreateFeedIncreaseConditionDto): Promise<MessageResponse> {
        return this.feedIncreaseConditionService.createFeedIncreaseCondition(dto);
    }
    @Get('/:id')
    @ApiOperation({ summary: 'Get feed increase condition detail by ID' })
    @ApiResponse({ status: 200, type: FeedIncreaseConditionResponse })
    async getFeedIncreaseCondition(@Param('id') id: string, @CurrentUserId() userId: string): Promise<FeedIncreaseConditionResponse> {
        return this.feedIncreaseConditionService.getFeedIncreaseCondition(id, userId);
    }

    @Patch('/:id')
    @ApiOperation({ summary: 'Update feed increase condition by ID' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async updateFeedIncreaseCondition(
        @Param('id') id: string,
        @Body() dto: CreateFeedIncreaseConditionDto
    ): Promise<MessageResponse> {
        return this.feedIncreaseConditionService.updateFeedIncreaseCondition(id, dto);
    }

    @Delete('/:id')
    @ApiOperation({ summary: 'Delete feed increase condition by ID' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async deleteFeedIncreaseCondition(@Param('id') id: string): Promise<MessageResponse> {
        return this.feedIncreaseConditionService.deleteFeedIncrease(id);
    }
}

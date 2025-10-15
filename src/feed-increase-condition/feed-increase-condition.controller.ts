import { Controller, Post } from '@nestjs/common';
import { FeedIncreaseConditionService } from './feed-increase-condition.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller('feed-increase-condition')
export class FeedIncreaseConditionController {
    constructor(private readonly feedIncreaseConditionService: FeedIncreaseConditionService) { }

    @Post('/create')
    @ApiResponse({ status: 201, description: 'Feed increase condition created successfully.' })
    async createFeedIncreaseCondition() {
        return this.feedIncreaseConditionService.createFeedIncreaseCondition();
    }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RecurringConditionService } from './recurring-condition.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetRecurringConditionDetailResponse } from './response';
import { CurrentUserId, CurrentUserRole } from 'src/common/decorators';
import { MessageResponse } from 'src/common/response';
import {
  CreateRecurringConditionDto,
  UpdateRecurringConditionDto,
} from './dto';
import { JwtGuard } from 'src/common/guards';
import { ConditionData } from 'src/condition/response';

@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('recurring-condition')
export class RecurringConditionController {
  constructor(
    private readonly recurringConditionService: RecurringConditionService,
  ) {}

  @Get('detail/:id')
  @ApiOperation({ summary: 'Get recurring condition detail info' })
  @ApiResponse({ status: 200, type: GetRecurringConditionDetailResponse })
  async getDetailRecurringCondition(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @CurrentUserRole() role: string
  ): Promise<GetRecurringConditionDetailResponse> {
    return this.recurringConditionService.getDetailRecurringCondition(
      userId,
      id,
      role
    );
  }

  @Post('create')
  @ApiOperation({ summary: 'create recurring condition info' })
  @ApiResponse({ status: 201, type: ConditionData })
  async createRecurringCondition(
    @CurrentUserId() userId: string,
    @Body() dto: CreateRecurringConditionDto,
  ): Promise<ConditionData> {
    return this.recurringConditionService.createRecurringCondition(userId, dto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'update recurring condition info' })
  @ApiResponse({ status: 200, type: ConditionData })
  async updateRecurringCondition(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: CreateRecurringConditionDto,
  ): Promise<ConditionData> {
    return this.recurringConditionService.updateRecurringCondition(
      userId,
      id,
      dto,
    );
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'delete recurring condition' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async deleteRecurringCondition(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    return this.recurringConditionService.deleteRecurringCondition(userId, id);
  }
}

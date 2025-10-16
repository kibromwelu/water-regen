import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HomeService } from './home.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtGuard } from 'src/common/guards';
import { CurrentUserId } from 'src/common/decorators';
import { GetHomeDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { GetHomeResponse } from './response';

@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get Aquaculture overview' })
  @ApiResponse({ status: 200, type: GetHomeResponse })
  async getAllTanks(
    @CurrentUserId() userId: string,
    @Query() dto: GetHomeDto,
  ): Promise<GetHomeResponse> {
    return this.homeService.getHome(userId, dto);
  }

  @Delete('remove-todo/:id')
  @ApiOperation({ summary: 'Remomve todo from the list' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async deleteTank(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    return this.homeService.removeTodo(userId, id);
  }
}

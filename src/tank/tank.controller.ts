import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtGuard } from 'src/common/guards';
import { TankService } from './tank.service';
import { CurrentUserId } from 'src/common/decorators';
import { GetTankDetailResponse, GetTanksListResponse } from './response';
import { CreateTankDto, UpdateTankDto } from './dto';
import { MessageResponse } from 'src/common/response';


@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('tank')
export class TankController {
    constructor(private readonly tankService: TankService) {}

    @Get('list')
    @ApiOperation({ summary: 'Get list of tanks' })
    @ApiResponse({ status: 200, type: [GetTanksListResponse] })
    async getAllTanks(
    @CurrentUserId() userId: string,
    ): Promise<GetTanksListResponse[]> {
    return this.tankService.getAllTanks(userId);
    }

    // @Get('detail/:id')
    // @ApiOperation({ summary: 'Get tank detail info' })
    // @ApiResponse({ status: 200, type: GetTankDetailResponse })
    // async getTankDetail(
    // @CurrentUserId() userId: string,
    // @Param('id') id: string,
    // ): Promise<GetTankDetailResponse> {
    // return this.tankService.getTankDetail(userId, id);
    // }

    @Post('create')
    @ApiOperation({ summary: 'create tank info' })
    @ApiResponse({ status: 201, type: MessageResponse })
    async createTank(
    @CurrentUserId() userId: string,
    @Body() dto: CreateTankDto,
    ): Promise<MessageResponse> {
    return this.tankService.createTank(userId, dto);
    }

    @Patch('update/:id')
    @ApiOperation({ summary: 'update tank info' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async updateTank(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTankDto,
    ): Promise<MessageResponse> {
    return this.tankService.updateTank(userId, id ,dto);
    }

    @Delete('delete/:id')
    @ApiOperation({ summary: 'delete tank' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async deleteTank(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    ): Promise<MessageResponse> {
    return this.tankService.deleteTank(userId, id );
    }
}

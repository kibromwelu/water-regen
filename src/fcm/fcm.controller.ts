import { Body, Controller, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtGuard } from 'src/common/guards';
import { MessageResponse } from 'src/common/response';
import { CurrentUserId } from 'src/common/decorators';
import { UpdateFCMTokenDto } from './dto';

@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Patch('update-token')
  @ApiOperation({ summary: 'Update user FCM token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fcm token has been updated successfully',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async updateFcmToken(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateFCMTokenDto,
  ): Promise<MessageResponse> {
    return this.fcmService.updateFcmToken(userId, dto.fcmToken);
  }
}

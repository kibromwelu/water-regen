import { Global, Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { FcmController } from './fcm.controller';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Global()
@Module({
  imports: [WebsocketModule],
  providers: [FcmService],
  controllers: [FcmController],
  exports: [FcmService],
})
export class FcmModule {}

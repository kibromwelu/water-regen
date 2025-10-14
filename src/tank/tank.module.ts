import { Module } from '@nestjs/common';
import { TankService } from './tank.service';
import { TankController } from './tank.controller';

@Module({
  providers: [TankService],
  controllers: [TankController]
})
export class TankModule {}

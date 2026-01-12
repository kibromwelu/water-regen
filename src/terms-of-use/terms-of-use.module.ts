import { Module } from '@nestjs/common';
import { TermsOfUseController } from './terms-of-use.controller';

@Module({
  controllers: [TermsOfUseController]
})
export class TermsOfUseModule {}

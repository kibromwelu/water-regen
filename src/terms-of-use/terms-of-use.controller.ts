import { Controller, Get, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('terms-of-use')
export class TermsOfUseController {

    private file(name: string) {
    return join(__dirname, '..', 'public', name);
  }

  @Get('privacy-policy')
  @Header('Content-Type', 'text/html')
  privacy(@Res() res: Response) {
    return res.sendFile(this.file('privacy_policy.html'));
  }

  @Get('terms-of-service')
  @Header('Content-Type', 'text/html')
  terms(@Res() res: Response) {
    return res.sendFile(this.file('terms_of_service.html'));
  }
}

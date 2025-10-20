import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { normalizePhoneNumber } from 'src/common/utils';

@Injectable()
export class SmsService {
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly serviceId: string;
  private readonly senderNumber: string;

  constructor(private configService: ConfigService) {
    this.accessKey = this.validateEnv('NCP_ACCESS_KEY');
    this.secretKey = this.validateEnv('NCP_SECRET_KEY');
    this.serviceId = this.validateEnv('NCP_SMS_SERVICE_ID');
    this.senderNumber = this.validateEnv('NCP_SMS_SENDER_NUMBER');
  }

  private validateEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new BadRequestException(`Environment variable ${key} is missing`);
    }
    return value;
  }

  async sendOtpSms(phoneNumber: string, otpCode: string) {
    console.log(`Sending OTP SMS to ${phoneNumber} with code ${otpCode}`);
    // Normalize phone number to local format [01123456789] 
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const timestamp = Date.now().toString();
    const method = 'POST';
    const url = `/sms/v2/services/${this.serviceId}/messages`;

    const signature = this.makeSignature(method, url, timestamp);

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-iam-access-key': this.accessKey,
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-apigw-signature-v2': signature,
    };

    const body = {
      type: 'SMS',
      from: this.senderNumber,
      content: `[워터리젠] 인증 코드 : ${otpCode}`,
      messages: [
        {
          to: normalizedPhoneNumber,
        },
      ],
    };

    try {
      const response = await axios.post(
        `https://sens.apigw.ntruss.com${url}`,
        body,
        { headers },
      );
      console.log(`SMS sent to ${normalizedPhoneNumber}: ${JSON.stringify(response.data)}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.log(`SMS send failed: ${error.response?.data?.message || error.message}`);
      throw new Error(`Failed to send OTP SMS: ${error.response?.data?.message || error.message}`);
    }
  }

  private makeSignature(method: string, url: string, timestamp: string): string {
    const space = ' ';
    const newLine = '\n';
    const message = `${method}${space}${url}${newLine}${timestamp}${newLine}${this.accessKey}`;
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(message);
    return hmac.digest('base64');
  }
}
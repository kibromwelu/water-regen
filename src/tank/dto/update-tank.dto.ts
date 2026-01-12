import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTankDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  whitelegShrimpStrain: string;

  // @ApiProperty()
  // @IsNumber()
  // @IsNotEmpty()
  // averageBodyWeight: number;

  // @ApiProperty()
  // @IsNumber()
  // @IsNotEmpty()
  // numberStocked: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  salinity?: number;
}

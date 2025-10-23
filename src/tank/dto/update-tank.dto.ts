import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTankDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  whitelegShrimpStrain?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  averageBodyWeight?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  numberStocked?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  salinity?: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class GetTankDetailResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  whitelegShrimpStrain: string;

  @ApiProperty()
  averageBodyWeight: number;

  @ApiProperty()
  numberStocked: number;

  @ApiProperty({ type: Number })
  salinity: number | null;
}

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
  waterTemperature: number | null;

  @ApiProperty({ type: Number })
  do: number | null;

  @ApiProperty({ type: Number })
  ph: number | null;

  @ApiProperty({ type: Number })
  nh4: number | null;

  @ApiProperty({ type: Number })
  no2: number | null;

  @ApiProperty({ type: Number })
  alk: number | null;

  @ApiProperty({ type: Number })
  salinity: number | null;
}

import { ApiProperty } from '@nestjs/swagger';

export class GetTanksListResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  tankerId: string;

  @ApiProperty()
  whitelegShrimpStrain: string;

  @ApiProperty()
  averageBodyWeight: number;

  @ApiProperty()
  numberStocked: number;

  @ApiProperty({ type: Number })
  salinity: number | null;

  @ApiProperty()
  createdAt: Date;
}

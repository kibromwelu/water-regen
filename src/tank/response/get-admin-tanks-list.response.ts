import { ApiProperty } from '@nestjs/swagger';

export class GetAdminTanksListResponse {
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
  shrimpOutput: number;

  @ApiProperty()
  hasCondition: boolean;
}

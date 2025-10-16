import { ApiProperty } from '@nestjs/swagger';

class TodoList {
  @ApiProperty()
  id: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  createdAt: Date;
}
class SummaryData {
  @ApiProperty()
  date: string;

  @ApiProperty()
  time: string;

  @ApiProperty()
  waterTemperature: number;

  @ApiProperty()
  do: number;

  @ApiProperty()
  ph: number;

  @ApiProperty()
  nh4: number;

  @ApiProperty()
  no2: number;

  @ApiProperty()
  alk: number;

  @ApiProperty()
  feedingData: number;

  @ApiProperty()
  supplementDosing: number;
}

export class GetHomeResponse {
  @ApiProperty({ type: String })
  tankId: string | null;

  @ApiProperty()
  totalTodo: number;

  @ApiProperty({ type: [TodoList] })
  todo: TodoList[];

  @ApiProperty({ type: [SummaryData] })
  data: SummaryData[];

  @ApiProperty()
  startDate: string;

  @ApiProperty({ type: String })
  endDate: string | null;

  @ApiProperty()
  isHourlyView: boolean;

  @ApiProperty()
  doc: number;

  @ApiProperty()
  AverageBodyWeight: number;
}

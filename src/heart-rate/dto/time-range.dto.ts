import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class TimeRangeDto {
  @ApiProperty({ example: '2024-03-01T00:00:00Z' })
  @IsISO8601()
  from!: string;

  @ApiProperty({ example: '2024-03-01T23:59:59Z' })
  @IsISO8601()
  to!: string;
}

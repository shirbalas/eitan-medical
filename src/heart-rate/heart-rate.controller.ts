import { Controller, Get, Param, Query } from '@nestjs/common';
import { HeartRateService } from './heart-rate.service';
import { TimeRangeDto } from './dto/time-range.dto';
import { EventsQueryDto } from './dto/events.query.dto';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('heart-rate')
@Controller('patients/:id/heart-rate')
export class HeartRateController {
  constructor(private readonly heartRateService: HeartRateService) {}

  @Get('events')
  @ApiQuery({
    name: 'threshold',
    required: false,
    example: 100,
    description: 'HR threshold (default 100)',
  })
  @ApiOkResponse({
    description: 'All readings above threshold for the patient',
    schema: {
      example: {
        patientId: '1',
        count: 2,
        events: [
          { timestamp: '2024-03-01T10:30:00Z', heartRate: 101 },
          { timestamp: '2024-03-01T14:05:00Z', heartRate: 110 },
        ],
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid threshold' })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  events(@Param('id') id: string, @Query() q: EventsQueryDto) {
    return this.heartRateService.getHighEvents(id, q.threshold);
  }

  @Get('analytics')
  @ApiQuery({ name: 'from', required: true, example: '2024-03-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: true, example: '2024-03-01T23:59:59Z' })
  @ApiOkResponse({
    description: 'Min/Max/Avg & count for time window',
    schema: {
      example: {
        patientId: '1',
        from: '2024-03-01T00:00:00Z',
        to: '2024-03-01T23:59:59Z',
        count: 3,
        avg: 94.33,
        min: 85,
        max: 101,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid time window (from>to or malformed)',
  })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  analytics(@Param('id') id: string, @Query() q: TimeRangeDto) {
    return this.heartRateService.getAnalytics(id, q.from, q.to);
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOkResponse({ description: 'List patients' })
  list() {
    return this.patientsService.getAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Patient details' })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  get(@Param('id') id: string) {
    return this.patientsService.getById(id);
  }

  @Get(':id/requests')
  @ApiOkResponse({
    description: 'Number of requests for this patient',
    schema: { example: { patientId: '1', requestsCount: 3 } },
  })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  requests(@Param('id') id: string) {
    return this.patientsService.getRequestsCount(id);
  }
}

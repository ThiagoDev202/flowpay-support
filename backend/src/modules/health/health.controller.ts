import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check da API',
    description: 'Retorna status de disponibilidade da aplicação',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação disponível',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-02-12T12:00:00.000Z',
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

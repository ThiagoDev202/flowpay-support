import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { TeamResponseDto } from './dto/team-response.dto';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todos os times',
    description: 'Retorna todos os times com contadores de agentes e tickets',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de times retornada com sucesso',
    type: [TeamResponseDto],
  })
  async findAll(): Promise<TeamResponseDto[]> {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar time por ID',
    description: 'Retorna detalhes de um time específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do time',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Time encontrado',
    type: TeamResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Time não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<TeamResponseDto> {
    return this.teamsService.findOne(id);
  }
}

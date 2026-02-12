import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { AgentResponseDto } from './dto/agent-response.dto';
import { UpdateAgentStatusDto } from './dto/update-agent-status.dto';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todos os agentes',
    description: 'Retorna todos os agentes com informações do time e tickets ativos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de agentes retornada com sucesso',
    type: [AgentResponseDto],
  })
  async findAll(): Promise<AgentResponseDto[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar agente por ID',
    description: 'Retorna detalhes de um agente específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do agente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Agente encontrado',
    type: AgentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Agente não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<AgentResponseDto> {
    return this.agentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do agente',
    description: 'Alterna o status online/offline de um agente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do agente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateAgentStatusDto,
    description: 'Novo status do agente',
  })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado com sucesso',
    type: AgentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Agente não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAgentStatusDto,
  ): Promise<AgentResponseDto> {
    return this.agentsService.updateStatus(id, dto);
  }
}

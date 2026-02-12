import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { TicketStatus, TicketSubject } from '@prisma/client';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo ticket',
    description:
      'Cria um novo ticket e distribui automaticamente para um agente disponível. Quando o time está lotado, o ticket permanece em WAITING na fila.',
  })
  @ApiBody({
    type: CreateTicketDto,
    description: 'Dados do ticket',
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket criado com sucesso',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async create(@Body() dto: CreateTicketDto): Promise<TicketResponseDto> {
    return this.ticketsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tickets',
    description: 'Retorna lista de tickets com filtros opcionais e paginação',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TicketStatus,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'subject',
    required: false,
    enum: TicketSubject,
    description: 'Filtrar por assunto',
  })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Filtrar por ID do agente',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de resultados (padrão: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Posição inicial (padrão: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets retornada com sucesso',
    type: [TicketResponseDto],
  })
  async findAll(
    @Query('status') status?: TicketStatus,
    @Query('subject') subject?: TicketSubject,
    @Query('agentId') agentId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<TicketResponseDto[]> {
    return this.ticketsService.findAll({
      status,
      subject,
      agentId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar ticket por ID',
    description: 'Retorna detalhes de um ticket específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ticket',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket encontrado',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<TicketResponseDto> {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Completar ticket',
    description:
      'Marca um ticket como completo e processa automaticamente o próximo ticket da fila do time correspondente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ticket',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket completado com sucesso',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ticket não está em progresso ou não tem agente atribuído',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket não encontrado',
  })
  async complete(@Param('id') id: string): Promise<TicketResponseDto> {
    return this.ticketsService.complete(id);
  }
}

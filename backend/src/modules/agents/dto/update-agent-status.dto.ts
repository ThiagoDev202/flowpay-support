import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAgentStatusDto {
  @ApiProperty({
    description: 'Novo status do agente (true = online, false = offline)',
    example: true,
  })
  @IsBoolean({
    message: 'isOnline deve ser um valor booleano',
  })
  isOnline: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, MinLength } from 'class-validator';
import { TicketSubject } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Maria Oliveira',
    minLength: 3,
  })
  @IsNotEmpty({
    message: 'Nome do cliente é obrigatório',
  })
  @IsString({
    message: 'Nome do cliente deve ser uma string',
  })
  @MinLength(3, {
    message: 'Nome do cliente deve ter pelo menos 3 caracteres',
  })
  customerName: string;

  @ApiProperty({
    description: 'Assunto do ticket',
    enum: TicketSubject,
    example: TicketSubject.CARD_PROBLEM,
  })
  @IsNotEmpty({
    message: 'Assunto é obrigatório',
  })
  @IsEnum(TicketSubject, {
    message: 'Assunto deve ser um dos valores: CARD_PROBLEM, LOAN_REQUEST, OTHER',
  })
  subject: TicketSubject;
}

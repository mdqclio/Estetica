import { IsEnum } from 'class-validator';
import { StatusAgendamento } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(StatusAgendamento, {
    message: 'status inválido (AGENDADO|CONFIRMADO|CONCLUIDO|CANCELADO)',
  })
  status: StatusAgendamento;
}

import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAgendamentoDto {
  @IsUUID(undefined, { message: 'clienteId inválido' })
  clienteId: string;

  @IsUUID(undefined, { message: 'servicoId inválido' })
  servicoId: string;

  @IsUUID(undefined, { message: 'profissionalId inválido' })
  profissionalId: string;

  @IsDateString({}, { message: 'dataHoraInicio inválida (ISO 8601)' })
  dataHoraInicio: string;

  // Opcional: si no se envía, se calcula con la duración del servicio.
  @IsOptional()
  @IsDateString({}, { message: 'dataHoraFim inválida (ISO 8601)' })
  dataHoraFim?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

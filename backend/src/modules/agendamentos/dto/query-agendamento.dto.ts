import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { StatusAgendamento } from '@prisma/client';

export class QueryAgendamentoDto {
  /** Rango: turnos cuyo inicio sea >= dataInicio */
  @IsOptional()
  @IsDateString({}, { message: 'dataInicio inválida (ISO 8601)' })
  dataInicio?: string;

  /** Rango: turnos cuyo inicio sea <= dataFim */
  @IsOptional()
  @IsDateString({}, { message: 'dataFim inválida (ISO 8601)' })
  dataFim?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'profissionalId inválido' })
  profissionalId?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'clienteId inválido' })
  clienteId?: string;

  @IsOptional()
  @IsEnum(StatusAgendamento, { message: 'status inválido' })
  status?: StatusAgendamento;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

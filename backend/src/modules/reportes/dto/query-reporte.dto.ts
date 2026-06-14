import { IsDateString } from 'class-validator';

export class QueryReporteDto {
  @IsDateString({}, { message: 'desde inválida (YYYY-MM-DD)' })
  desde: string;

  @IsDateString({}, { message: 'hasta inválida (YYYY-MM-DD)' })
  hasta: string;
}

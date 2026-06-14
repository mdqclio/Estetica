import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServicoDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsInt({ message: 'A duração deve ser um número inteiro de minutos' })
  @Min(1, { message: 'A duração mínima é 1 minuto' })
  duracaoMinutos: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O valor deve ser um número com até 2 casas decimais' },
  )
  @Min(0, { message: 'O valor não pode ser negativo' })
  preco: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

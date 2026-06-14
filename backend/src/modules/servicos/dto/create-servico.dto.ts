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
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsInt({ message: 'La duración debe ser un número entero de minutos' })
  @Min(1, { message: 'La duración mínima es 1 minuto' })
  duracaoMinutos: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  preco: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

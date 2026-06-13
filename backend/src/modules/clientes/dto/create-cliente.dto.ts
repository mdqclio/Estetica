import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nome: string;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'El CPF debe tener 11 dígitos numéricos' })
  cpf: string;

  @IsOptional()
  @IsString()
  @Length(8, 20, { message: 'Teléfono inválido' })
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de nacimiento inválida (YYYY-MM-DD)' })
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

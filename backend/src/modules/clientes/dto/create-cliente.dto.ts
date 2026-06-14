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
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'O CPF deve ter 11 dígitos numéricos' })
  cpf: string;

  @IsOptional()
  @IsString()
  @Length(8, 20, { message: 'Telefone inválido' })
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento inválida (YYYY-MM-DD)' })
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

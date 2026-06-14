export type Perfil = 'ADMIN' | 'RECEPCIONISTA' | 'PROFISSIONAL';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string | null;
  email?: string | null;
  dataNascimento?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioInput {
  nome: string;
  email: string;
  senha?: string;
  perfil: Perfil;
  ativo?: boolean;
}

export interface ClienteInput {
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  endereco?: string;
  observacoes?: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string | null;
  duracaoMinutos: number;
  // El backend usa Decimal y lo serializa como string en JSON.
  preco: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicoInput {
  nome: string;
  descricao?: string;
  duracaoMinutos: number;
  preco: number;
  ativo?: boolean;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  access_token: string;
  user: Usuario;
}

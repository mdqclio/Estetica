import api from './api';
import {
  Agendamento,
  AgendamentoInput,
  Paginated,
  StatusAgendamento,
} from '../types';

export interface ListParams {
  dataInicio?: string;
  dataFim?: string;
  profissionalId?: string;
  clienteId?: string;
  status?: StatusAgendamento;
  page?: number;
  limit?: number;
}

export const agendamentosService = {
  async list(params: ListParams = {}): Promise<Paginated<Agendamento>> {
    const { data } = await api.get<Paginated<Agendamento>>('/agendamentos', {
      params: clean(params),
    });
    return data;
  },

  async get(id: string): Promise<Agendamento> {
    const { data } = await api.get<Agendamento>(`/agendamentos/${id}`);
    return data;
  },

  async create(input: AgendamentoInput): Promise<Agendamento> {
    const { data } = await api.post<Agendamento>(
      '/agendamentos',
      clean(input),
    );
    return data;
  },

  async update(id: string, input: AgendamentoInput): Promise<Agendamento> {
    const { data } = await api.put<Agendamento>(
      `/agendamentos/${id}`,
      clean(input),
    );
    return data;
  },

  async updateStatus(
    id: string,
    status: StatusAgendamento,
  ): Promise<Agendamento> {
    const { data } = await api.patch<Agendamento>(
      `/agendamentos/${id}/status`,
      { status },
    );
    return data;
  },
};

// Quita campos vacíos para no enviar strings vacíos al backend.
function clean<T extends object>(input: T): T {
  const out: Record<string, unknown> = {};
  Object.entries(input as Record<string, unknown>).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) {
      out[k] = v;
    }
  });
  return out as T;
}

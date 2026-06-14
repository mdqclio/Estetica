import api from './api';
import { Servico, ServicoInput, Paginated } from '../types';

export interface ListParams {
  search?: string;
  page?: number;
  limit?: number;
  ativo?: string;
}

export const servicosService = {
  async list(params: ListParams = {}): Promise<Paginated<Servico>> {
    const { data } = await api.get<Paginated<Servico>>('/servicos', { params });
    return data;
  },

  async get(id: string): Promise<Servico> {
    const { data } = await api.get<Servico>(`/servicos/${id}`);
    return data;
  },

  async create(input: ServicoInput): Promise<Servico> {
    const { data } = await api.post<Servico>('/servicos', clean(input));
    return data;
  },

  async update(id: string, input: ServicoInput): Promise<Servico> {
    const { data } = await api.put<Servico>(`/servicos/${id}`, clean(input));
    return data;
  },

  async inativar(id: string): Promise<Servico> {
    const { data } = await api.patch<Servico>(`/servicos/${id}/inativar`);
    return data;
  },

  async reativar(id: string): Promise<Servico> {
    const { data } = await api.patch<Servico>(`/servicos/${id}/reativar`);
    return data;
  },
};

// Quita campos vacíos para no enviar strings vacíos al backend.
// Conserva números (incluido 0) y booleanos.
function clean(input: ServicoInput): ServicoInput {
  const out: Record<string, unknown> = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) {
      out[k] = v;
    }
  });
  return out as unknown as ServicoInput;
}

import api from './api';
import { Cliente, ClienteInput, Paginated } from '../types';

export interface ListParams {
  search?: string;
  page?: number;
  limit?: number;
  ativo?: string;
}

export const clientesService = {
  async list(params: ListParams = {}): Promise<Paginated<Cliente>> {
    const { data } = await api.get<Paginated<Cliente>>('/clientes', { params });
    return data;
  },

  async get(id: string): Promise<Cliente> {
    const { data } = await api.get<Cliente>(`/clientes/${id}`);
    return data;
  },

  async create(input: ClienteInput): Promise<Cliente> {
    const { data } = await api.post<Cliente>('/clientes', clean(input));
    return data;
  },

  async update(id: string, input: ClienteInput): Promise<Cliente> {
    const { data } = await api.put<Cliente>(`/clientes/${id}`, clean(input));
    return data;
  },

  async inativar(id: string): Promise<Cliente> {
    const { data } = await api.patch<Cliente>(`/clientes/${id}/inativar`);
    return data;
  },

  async reativar(id: string): Promise<Cliente> {
    const { data } = await api.patch<Cliente>(`/clientes/${id}/reativar`);
    return data;
  },
};

// Quita campos vacíos para no enviar strings vacíos al backend
function clean(input: ClienteInput): ClienteInput {
  const out: Record<string, unknown> = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) {
      out[k] = v;
    }
  });
  return out as unknown as ClienteInput;
}

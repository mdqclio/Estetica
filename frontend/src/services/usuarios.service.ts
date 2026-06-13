import api from './api';
import { Usuario, UsuarioInput } from '../types';

export const usuariosService = {
  async list(): Promise<Usuario[]> {
    const { data } = await api.get<Usuario[]>('/usuarios');
    return data;
  },
  async get(id: string): Promise<Usuario> {
    const { data } = await api.get<Usuario>(`/usuarios/${id}`);
    return data;
  },
  async create(input: UsuarioInput): Promise<Usuario> {
    const { data } = await api.post<Usuario>('/usuarios', clean(input));
    return data;
  },
  async update(id: string, input: UsuarioInput): Promise<Usuario> {
    const { data } = await api.put<Usuario>(`/usuarios/${id}`, clean(input));
    return data;
  },
  async inativar(id: string): Promise<Usuario> {
    const { data } = await api.patch<Usuario>(`/usuarios/${id}/inativar`);
    return data;
  },
};

// Quita campos vacíos (p. ej. senha en blanco al editar) para no romper la
// validación del backend. Conserva booleanos false.
function clean(input: UsuarioInput): UsuarioInput {
  const out: Record<string, unknown> = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) {
      out[k] = v;
    }
  });
  return out as unknown as UsuarioInput;
}

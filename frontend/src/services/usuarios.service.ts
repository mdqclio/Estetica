import api from './api';
import { Usuario } from '../types';

export const usuariosService = {
  async list(): Promise<Usuario[]> {
    const { data } = await api.get<Usuario[]>('/usuarios');
    return data;
  },
  async inativar(id: string): Promise<Usuario> {
    const { data } = await api.patch<Usuario>(`/usuarios/${id}/inativar`);
    return data;
  },
};

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Perfil, Usuario } from '../types';
import { usuariosService } from '../services/usuarios.service';

const PERFIL_LABEL: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  PROFISSIONAL: 'Profissional',
};

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      setUsuarios(await usuariosService.list());
    } catch {
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function inativar(u: Usuario) {
    if (!confirm(`Tem certeza que deseja inativar ${u.nome}?`)) return;
    try {
      await usuariosService.inativar(u.id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Ação não permitida.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        <Link
          to="/usuarios/nuevo"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Novo usuário
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{PERFIL_LABEL[u.perfil]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/usuarios/${u.id}/editar`}
                        className="text-xs text-brand-700 hover:underline"
                      >
                        Editar
                      </Link>
                      {u.ativo && (
                        <button
                          onClick={() => inativar(u)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Inativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

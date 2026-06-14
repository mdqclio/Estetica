import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cliente, Paginated } from '../types';
import { clientesService } from '../services/clientes.service';
import { useAuth } from '../hooks/useAuth';

const LIMIT = 10;

export function ClientesList() {
  const { hasRole } = useAuth();
  const podeEditar = hasRole('ADMIN', 'RECEPCIONISTA');
  const podeReativar = hasRole('ADMIN');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Cliente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await clientesService.list({ search, page, limit: LIMIT });
      setResult(data);
    } catch {
      setError('Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Buscar con debounce simple al cambiar el texto
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggleAtivo(c: Cliente) {
    try {
      if (c.ativo) {
        await clientesService.inativar(c.id);
      } else {
        await clientesService.reativar(c.id);
      }
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Ação não permitida.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        {podeEditar && (
          <Link
            to="/clientes/nuevo"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Novo cliente
          </Link>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, CPF, telefone ou e-mail…"
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

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
              <th className="hidden px-4 py-3 sm:table-cell">CPF</th>
              <th className="hidden px-4 py-3 md:table-cell">Telefone</th>
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
            ) : result && result.data.length > 0 ? (
              result.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <Link to={`/clientes/${c.id}`} className="hover:text-brand-700">
                      {c.nome}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    {c.cpf}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {c.telefone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/clientes/${c.id}`}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Ver
                      </Link>
                      {podeEditar && (
                        <Link
                          to={`/clientes/${c.id}/editar`}
                          className="text-xs text-brand-700 hover:underline"
                        >
                          Editar
                        </Link>
                      )}
                      {/* Inativar: ADMIN o RECEPCIONISTA. Reativar: solo ADMIN */}
                      {c.ativo
                        ? podeEditar && (
                            <button
                              onClick={() => toggleAtivo(c)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Inativar
                            </button>
                          )
                        : podeReativar && (
                            <button
                              onClick={() => toggleAtivo(c)}
                              className="text-xs text-green-600 hover:underline"
                            >
                              Reativar
                            </button>
                          )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {result && result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Página {result.page} de {result.totalPages} · {result.total} no total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={page >= result.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

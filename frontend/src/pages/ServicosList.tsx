import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Servico, Paginated } from '../types';
import { servicosService } from '../services/servicos.service';
import { useAuth } from '../hooks/useAuth';

const LIMIT = 10;

function formatPreco(preco: string): string {
  return Number(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDuracao(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function ServicosList() {
  const { hasRole } = useAuth();
  const podeGerenciar = hasRole('ADMIN');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Servico> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await servicosService.list({ search, page, limit: LIMIT });
      setResult(data);
    } catch {
      setError('Não foi possível carregar os serviços.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggleAtivo(s: Servico) {
    try {
      if (s.ativo) {
        await servicosService.inativar(s.id);
      } else {
        await servicosService.reativar(s.id);
      }
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Ação não permitida.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Serviços</h1>
        {podeGerenciar && (
          <Link
            to="/servicos/nuevo"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Novo serviço
          </Link>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome ou descrição…"
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
              <th className="hidden px-4 py-3 md:table-cell">Duração</th>
              <th className="px-4 py-3">Preço</th>
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
              result.data.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {s.nome}
                    {s.descricao && (
                      <span className="block text-xs font-normal text-gray-500">
                        {s.descricao}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {formatDuracao(s.duracaoMinutos)}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {formatPreco(s.preco)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {podeGerenciar ? (
                        <>
                          <Link
                            to={`/servicos/${s.id}/editar`}
                            className="text-xs text-brand-700 hover:underline"
                          >
                            Editar
                          </Link>
                          {s.ativo ? (
                            <button
                              onClick={() => toggleAtivo(s)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Inativar
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleAtivo(s)}
                              className="text-xs text-green-600 hover:underline"
                            >
                              Reativar
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum serviço encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

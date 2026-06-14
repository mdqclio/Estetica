import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Agendamento,
  Paginated,
  ProfissionalRef,
  StatusAgendamento,
} from '../types';
import { agendamentosService } from '../services/agendamentos.service';
import { usuariosService } from '../services/usuarios.service';
import { useAuth } from '../hooks/useAuth';

const LIMIT = 10;

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const STATUS_CLASS: Record<StatusAgendamento, string> = {
  AGENDADO: 'bg-blue-100 text-blue-700',
  CONFIRMADO: 'bg-amber-100 text-amber-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-gray-200 text-gray-600',
};

function formatDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AgendamentosList() {
  const { hasRole } = useAuth();
  const podeGerenciar = hasRole('ADMIN', 'RECEPCIONISTA');

  const [data, setData] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [status, setStatus] = useState<StatusAgendamento | ''>('');
  const [page, setPage] = useState(1);

  const [profissionais, setProfissionais] = useState<ProfissionalRef[]>([]);
  const [result, setResult] = useState<Paginated<Agendamento> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Los profesionales para el filtro solo los puede listar ADMIN/RECEPCIONISTA.
  useEffect(() => {
    if (!podeGerenciar) return;
    usuariosService
      .profissionais()
      .then(setProfissionais)
      .catch(() => setProfissionais([]));
  }, [podeGerenciar]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await agendamentosService.list({
        page,
        limit: LIMIT,
        profissionalId: profissionalId || undefined,
        status: status || undefined,
        dataInicio: data ? `${data}T00:00:00` : undefined,
        dataFim: data ? `${data}T23:59:59` : undefined,
      });
      setResult(res);
    } catch {
      setError('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, data, profissionalId, status]);

  async function cambiarEstado(a: Agendamento, nuevo: StatusAgendamento) {
    try {
      await agendamentosService.updateStatus(a.id, nuevo);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Ação não permitida.');
    }
  }

  const field =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Agendamentos</h1>
        {podeGerenciar && (
          <Link
            to="/agendamentos/nuevo"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Novo agendamento
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={data}
          onChange={(e) => {
            setPage(1);
            setData(e.target.value);
          }}
          className={field}
        />
        {podeGerenciar && (
          <select
            value={profissionalId}
            onChange={(e) => {
              setPage(1);
              setProfissionalId(e.target.value);
            }}
            className={field}
          >
            <option value="">Todos os profissionais</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        )}
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as StatusAgendamento | '');
          }}
          className={field}
        >
          <option value="">Todos os status</option>
          <option value="AGENDADO">Agendado</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        {(data || profissionalId || status) && (
          <button
            onClick={() => {
              setPage(1);
              setData('');
              setProfissionalId('');
              setStatus('');
            }}
            className="text-sm text-gray-500 hover:underline"
          >
            Limpar filtros
          </button>
        )}
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
              <th className="px-4 py-3">Data / hora</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="hidden px-4 py-3 md:table-cell">Serviço</th>
              <th className="hidden px-4 py-3 lg:table-cell">Profissional</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : result && result.data.length > 0 ? (
              result.data.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {formatDataHora(a.dataHoraInicio)}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {a.cliente?.nome ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {a.servico?.nome ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                    {a.profissional?.nome ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[a.status]}`}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {podeGerenciar ? (
                        <>
                          {a.status === 'AGENDADO' && (
                            <button
                              onClick={() => cambiarEstado(a, 'CONFIRMADO')}
                              className="text-xs text-amber-700 hover:underline"
                            >
                              Confirmar
                            </button>
                          )}
                          {a.status === 'CONFIRMADO' && (
                            <button
                              onClick={() => cambiarEstado(a, 'CONCLUIDO')}
                              className="text-xs text-green-700 hover:underline"
                            >
                              Concluir
                            </button>
                          )}
                          {(a.status === 'AGENDADO' ||
                            a.status === 'CONFIRMADO') && (
                            <>
                              <Link
                                to={`/agendamentos/${a.id}/editar`}
                                className="text-xs text-brand-700 hover:underline"
                              >
                                Editar
                              </Link>
                              <button
                                onClick={() => cambiarEstado(a, 'CANCELADO')}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Cancelar
                              </button>
                            </>
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum agendamento.
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardMetrics, StatusAgendamento } from '../types';
import { dashboardService } from '../services/dashboard.service';
import { useAuth } from '../hooks/useAuth';

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendados',
  CONFIRMADO: 'Confirmados',
  CONCLUIDO: 'Concluídos',
  CANCELADO: 'Cancelados',
};

function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 'YYYY-MM-DD' -> etiqueta de día corta (lun, mar, …)
function diaLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent ?? 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [m, setM] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService
      .metrics()
      .then(setM)
      .catch(() => setError('Não foi possível carregar as métricas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-400">Carregando métricas…</p>;
  }
  if (error || !m) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {error || 'Sem dados.'}
      </p>
    );
  }

  const maxDia = Math.max(1, ...m.turnosPorDia.map((d) => d.total));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Painel</h1>
      <p className="mb-6 text-sm text-gray-500">
        Olá, {user?.nome}. Resumo da semana ({m.periodo.inicio} →{' '}
        {m.periodo.fim}).
      </p>

      {/* Tarjetas */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Clientes ativos" value={m.clientesAtivos} />
        <Card
          label="Agendamentos de hoje"
          value={m.turnosHoje}
          accent="text-brand-700"
        />
        <Card label="Agendamentos da semana" value={m.turnosSemana} />
        <Card
          label="Faturamento (semana)"
          value={formatBRL(m.faturamentoEstimado)}
          accent="text-green-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico: turnos por día */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Agendamentos por dia
          </h2>
          <div className="flex h-40 items-end justify-between gap-2">
            {m.turnosPorDia.map((d) => (
              <div
                key={d.data}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-xs font-medium text-gray-600">
                  {d.total > 0 ? d.total : ''}
                </span>
                <div
                  className="w-full rounded-t bg-brand-500"
                  style={{
                    height: `${(d.total / maxDia) * 100}%`,
                    minHeight: d.total > 0 ? '4px' : '0',
                  }}
                  title={`${d.data}: ${d.total}`}
                />
                <span className="text-xs text-gray-400">
                  {diaLabel(d.data)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Turnos por status */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Agendamentos por status
          </h2>
          <ul className="space-y-2">
            {(Object.keys(m.turnosPorStatus) as StatusAgendamento[]).map(
              (s) => (
                <li
                  key={s}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{STATUS_LABEL[s]}</span>
                  <span className="font-semibold text-gray-800">
                    {m.turnosPorStatus[s]}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Próximos turnos */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Próximos agendamentos
            </h2>
            <Link
              to="/agendamentos"
              className="text-xs text-brand-700 hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {m.proximosTurnos.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum agendamento próximo.</p>
          ) : (
            <ul className="divide-y">
              {m.proximosTurnos.map((a) => (
                <li key={a.id} className="py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-800">
                      {a.cliente?.nome ?? '—'}
                    </span>
                    <span className="text-gray-500">
                      {formatDataHora(a.dataHoraInicio)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {a.servico?.nome ?? '—'} · {a.profissional?.nome ?? '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Servicios más solicitados */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Serviços mais solicitados
          </h2>
          {m.servicosMaisSolicitados.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados.</p>
          ) : (
            <ul className="space-y-2">
              {m.servicosMaisSolicitados.map((s) => (
                <li
                  key={s.servicoId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{s.nome}</span>
                  <span className="font-semibold text-gray-800">
                    {s.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

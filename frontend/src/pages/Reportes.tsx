import { useEffect, useMemo, useState } from 'react';
import { ReporteResumen, StatusAgendamento } from '../types';
import { reportesService } from '../services/reportes.service';

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendados',
  CONFIRMADO: 'Confirmados',
  CONCLUIDO: 'Concluidos',
  CANCELADO: 'Cancelados',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Preset = 'hoy' | 'semana' | 'mes' | 'mesAnterior' | 'personalizado';

function rangoPreset(p: Preset): { desde: string; hasta: string } | null {
  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'hoy') return { desde: iso(hoy), hasta: iso(hoy) };
  if (p === 'semana') {
    const diff = (hoy.getDay() + 6) % 7; // lunes
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diff);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return { desde: iso(lunes), hasta: iso(domingo) };
  }
  if (p === 'mes') {
    const ini = new Date(now.getFullYear(), now.getMonth(), 1);
    const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { desde: iso(ini), hasta: iso(fim) };
  }
  if (p === 'mesAnterior') {
    const ini = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const fim = new Date(now.getFullYear(), now.getMonth(), 0);
    return { desde: iso(ini), hasta: iso(fim) };
  }
  return null; // personalizado
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mesAnterior', label: 'Mes anterior' },
  { key: 'personalizado', label: 'Personalizado' },
];

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accent ?? 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  );
}

export function Reportes() {
  const inicial = rangoPreset('mes')!;
  const [preset, setPreset] = useState<Preset>('mes');
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);

  const [data, setData] = useState<ReporteResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  function aplicarPreset(p: Preset) {
    setPreset(p);
    const r = rangoPreset(p);
    if (r) {
      setDesde(r.desde);
      setHasta(r.hasta);
    }
  }

  async function load() {
    if (!desde || !hasta) return;
    setLoading(true);
    setError('');
    try {
      setData(await reportesService.resumen(desde, hasta));
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'No se pudo cargar el reporte.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  async function exportar() {
    setExporting(true);
    try {
      await reportesService.exportCsv(desde, hasta);
    } catch {
      alert('No se pudo exportar el CSV.');
    } finally {
      setExporting(false);
    }
  }

  const maxSerie = useMemo(
    () => Math.max(1, ...(data?.serie.pontos.map((p) => p.total) ?? [1])),
    [data],
  );

  const field =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <button
          onClick={exportar}
          disabled={exporting || !data}
          className="inline-flex items-center justify-center rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
        >
          {exporting ? 'Exportando…' : '⬇ Exportar CSV'}
        </button>
      </div>

      {/* Presets + rango personalizado */}
      <div className="mb-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => aplicarPreset(p.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              preset === p.key
                ? 'bg-brand-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'personalizado' && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>Desde</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className={field}
          />
          <span>hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className={field}
          />
        </div>
      )}
      <p className="mb-6 text-sm text-gray-500">
        Período: {desde} → {hasta}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading || !data ? (
        <p className="text-gray-400">Cargando reporte…</p>
      ) : (
        <>
          {/* Tarjetas */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card
              label="Facturación"
              value={formatBRL(data.faturamentoTotal)}
              accent="text-green-700"
            />
            <Card
              label="Ticket promedio"
              value={formatBRL(data.ticketMedio)}
            />
            <Card
              label="Turnos concluidos"
              value={`${data.turnosConcluidos} / ${data.totalTurnos}`}
            />
            <Card
              label="Tasa de cancelación"
              value={`${(data.taxaCancelamento * 100).toFixed(1)}%`}
              accent="text-red-600"
            />
          </div>

          {/* Comparativa */}
          {data.comparativa.variacaoPct !== null && (
            <p className="mb-6 text-sm text-gray-600">
              vs. período anterior ({data.comparativa.periodoAnterior.desde} →{' '}
              {data.comparativa.periodoAnterior.hasta}):{' '}
              <span
                className={
                  data.comparativa.variacaoPct >= 0
                    ? 'font-semibold text-green-700'
                    : 'font-semibold text-red-600'
                }
              >
                {data.comparativa.variacaoPct >= 0 ? '▲' : '▼'}{' '}
                {Math.abs(data.comparativa.variacaoPct)}%
              </span>{' '}
              (antes {formatBRL(data.comparativa.faturamentoAnterior)})
            </p>
          )}

          {/* Gráfico serie temporal */}
          <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              Facturación por {data.serie.granularidade === 'mes' ? 'mes' : 'día'}
            </h2>
            {data.serie.pontos.length === 0 ? (
              <p className="text-sm text-gray-400">
                Sin facturación en el período.
              </p>
            ) : (
              <div className="flex h-44 items-end gap-1 overflow-x-auto">
                {data.serie.pontos.map((p) => (
                  <div
                    key={p.periodo}
                    className="flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1"
                    title={`${p.periodo}: ${formatBRL(p.total)}`}
                  >
                    <div
                      className="w-full rounded-t bg-brand-500"
                      style={{ height: `${(p.total / maxSerie) * 100}%` }}
                    />
                    <span className="whitespace-nowrap text-[10px] text-gray-400">
                      {p.periodo.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Por servicio */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                Facturación por servicio
              </h2>
              <Tabla
                rows={data.faturamentoPorServico}
                col1="Servicio"
              />
            </div>
            {/* Por profesional */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                Facturación por profesional
              </h2>
              <Tabla
                rows={data.faturamentoPorProfissional}
                col1="Profesional"
              />
            </div>

            {/* Turnos por estado */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                Turnos por estado
              </h2>
              <ul className="space-y-2">
                {(Object.keys(data.turnosPorStatus) as StatusAgendamento[]).map(
                  (s) => (
                    <li
                      key={s}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{STATUS_LABEL[s]}</span>
                      <span className="font-semibold text-gray-800">
                        {data.turnosPorStatus[s]}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Tabla({
  rows,
  col1,
}: {
  rows: { id: string; nome: string; total: number; quantidade: number }[];
  col1: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">Sin datos en el período.</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-gray-500">
        <tr>
          <th className="pb-2">{col1}</th>
          <th className="pb-2 text-right">Cant.</th>
          <th className="pb-2 text-right">Facturación</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="py-2 text-gray-700">{r.nome}</td>
            <td className="py-2 text-right text-gray-600">{r.quantidade}</td>
            <td className="py-2 text-right font-medium text-gray-800">
              {formatBRL(r.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

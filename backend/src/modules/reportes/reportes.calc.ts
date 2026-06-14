import { StatusAgendamento } from '@prisma/client';

// Representación liviana de un turno para los cálculos de reportes.
// `valor` ya es number (se convierte desde Prisma.Decimal en el service).
export interface TurnoCalc {
  status: StatusAgendamento;
  valor: number;
  dataHoraInicio: Date;
  servicoId: string;
  servicoNome: string;
  profissionalId: string;
  profissionalNome: string;
}

export type Granularidade = 'dia' | 'mes';

const round2 = (n: number): number => Math.round(n * 100) / 100;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function isConcluido(t: TurnoCalc): boolean {
  return t.status === StatusAgendamento.CONCLUIDO;
}

/** Faturamento total: suma de `valor` SOLO de turnos CONCLUIDO. */
export function faturamentoTotal(turnos: TurnoCalc[]): number {
  return round2(
    turnos.filter(isConcluido).reduce((sum, t) => sum + t.valor, 0),
  );
}

/** Cantidad de turnos por status (4 claves siempre presentes). */
export function contarPorStatus(
  turnos: TurnoCalc[],
): Record<StatusAgendamento, number> {
  const out: Record<StatusAgendamento, number> = {
    AGENDADO: 0,
    CONFIRMADO: 0,
    CONCLUIDO: 0,
    CANCELADO: 0,
  };
  for (const t of turnos) out[t.status] += 1;
  return out;
}

/** Ticket promedio = faturamento / cantidad de concluidos (0 si no hay). */
export function ticketMedio(turnos: TurnoCalc[]): number {
  const concluidos = turnos.filter(isConcluido);
  if (concluidos.length === 0) return 0;
  return round2(faturamentoTotal(turnos) / concluidos.length);
}

/** Tasa de cancelación = cancelados / total del período (0 si no hay turnos). */
export function taxaCancelamento(turnos: TurnoCalc[]): number {
  if (turnos.length === 0) return 0;
  const cancelados = turnos.filter(
    (t) => t.status === StatusAgendamento.CANCELADO,
  ).length;
  return round2(cancelados / turnos.length);
}

export interface RankingItem {
  id: string;
  nome: string;
  total: number;
  quantidade: number;
}

function ranking(
  turnos: TurnoCalc[],
  keyId: (t: TurnoCalc) => string,
  keyNome: (t: TurnoCalc) => string,
): RankingItem[] {
  const map = new Map<string, RankingItem>();
  for (const t of turnos.filter(isConcluido)) {
    const id = keyId(t);
    const cur = map.get(id) ?? { id, nome: keyNome(t), total: 0, quantidade: 0 };
    cur.total = round2(cur.total + t.valor);
    cur.quantidade += 1;
    map.set(id, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Faturamento por servicio (solo CONCLUIDO), ordenado desc. */
export function faturamentoPorServico(turnos: TurnoCalc[]): RankingItem[] {
  return ranking(
    turnos,
    (t) => t.servicoId,
    (t) => t.servicoNome,
  );
}

/** Faturamento por profesional (solo CONCLUIDO), ordenado desc. */
export function faturamentoPorProfissional(turnos: TurnoCalc[]): RankingItem[] {
  return ranking(
    turnos,
    (t) => t.profissionalId,
    (t) => t.profissionalNome,
  );
}

/** Día o mes según el largo del rango (> 62 días => por mes). */
export function granularidade(desde: Date, hasta: Date): Granularidade {
  const dias = (hasta.getTime() - desde.getTime()) / 86_400_000;
  return dias > 62 ? 'mes' : 'dia';
}

function periodoKey(d: Date, gran: Granularidade): string {
  return gran === 'mes'
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Serie temporal de faturamento (solo CONCLUIDO) agrupada por día o mes. */
export function serieFaturamento(
  turnos: TurnoCalc[],
  gran: Granularidade,
): { periodo: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of turnos.filter(isConcluido)) {
    const key = periodoKey(t.dataHoraInicio, gran);
    map.set(key, round2((map.get(key) ?? 0) + t.valor));
  }
  return [...map.entries()]
    .map(([periodo, total]) => ({ periodo, total }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
}

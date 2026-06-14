import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StatusAgendamento } from '@prisma/client';
import {
  faturamentoTotal,
  contarPorStatus,
  ticketMedio,
  taxaCancelamento,
  faturamentoPorServico,
  faturamentoPorProfissional,
  granularidade,
  serieFaturamento,
  TurnoCalc,
} from './reportes.calc';

function turno(over: Partial<TurnoCalc>): TurnoCalc {
  return {
    status: StatusAgendamento.CONCLUIDO,
    valor: 100,
    dataHoraInicio: new Date('2026-06-10T10:00:00'),
    servicoId: 's1',
    servicoNome: 'Servicio 1',
    profissionalId: 'p1',
    profissionalNome: 'Pro 1',
    ...over,
  };
}

// Mezcla: 2 concluidos (120 + 150), 1 agendado, 1 cancelado
const SAMPLE: TurnoCalc[] = [
  turno({ status: StatusAgendamento.CONCLUIDO, valor: 120, servicoId: 's1', servicoNome: 'Limpeza', profissionalId: 'p1', profissionalNome: 'Ana' }),
  turno({ status: StatusAgendamento.CONCLUIDO, valor: 150, servicoId: 's2', servicoNome: 'Massagem', profissionalId: 'p2', profissionalNome: 'Bia' }),
  turno({ status: StatusAgendamento.AGENDADO, valor: 999, servicoId: 's1', servicoNome: 'Limpeza', profissionalId: 'p1', profissionalNome: 'Ana' }),
  turno({ status: StatusAgendamento.CANCELADO, valor: 999, servicoId: 's2', servicoNome: 'Massagem', profissionalId: 'p2', profissionalNome: 'Bia' }),
];

test('faturamento suma SOLO concluidos sobre valor (ignora agendado/cancelado)', () => {
  assert.equal(faturamentoTotal(SAMPLE), 270); // 120 + 150
});

test('faturamento de lista vacía es 0', () => {
  assert.equal(faturamentoTotal([]), 0);
});

test('contarPorStatus cuenta cada estado', () => {
  assert.deepEqual(contarPorStatus(SAMPLE), {
    AGENDADO: 1,
    CONFIRMADO: 0,
    CONCLUIDO: 2,
    CANCELADO: 1,
  });
});

test('ticket promedio = faturamento / concluidos', () => {
  assert.equal(ticketMedio(SAMPLE), 135); // 270 / 2
});

test('ticket promedio sin concluidos es 0 (no divide por cero)', () => {
  const sinConcluidos = [turno({ status: StatusAgendamento.AGENDADO })];
  assert.equal(ticketMedio(sinConcluidos), 0);
});

test('tasa de cancelación = cancelados / total', () => {
  assert.equal(taxaCancelamento(SAMPLE), 0.25); // 1 de 4
});

test('tasa de cancelación de lista vacía es 0', () => {
  assert.equal(taxaCancelamento([]), 0);
});

test('faturamento por servicio agrupa y ordena desc, solo concluidos', () => {
  const r = faturamentoPorServico(SAMPLE);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], { id: 's2', nome: 'Massagem', total: 150, quantidade: 1 });
  assert.deepEqual(r[1], { id: 's1', nome: 'Limpeza', total: 120, quantidade: 1 });
});

test('faturamento por profesional agrupa solo concluidos', () => {
  const r = faturamentoPorProfissional(SAMPLE);
  assert.equal(r.length, 2);
  assert.equal(r[0].total + r[1].total, 270);
});

test('granularidad: <=62 días por día, >62 por mes', () => {
  assert.equal(granularidade(new Date('2026-06-01'), new Date('2026-06-30')), 'dia');
  assert.equal(granularidade(new Date('2026-01-01'), new Date('2026-06-30')), 'mes');
});

test('serie de faturamento agrupa por día (solo concluidos) y ordena', () => {
  const turnos = [
    turno({ valor: 100, dataHoraInicio: new Date('2026-06-11T09:00:00') }),
    turno({ valor: 50, dataHoraInicio: new Date('2026-06-10T09:00:00') }),
    turno({ valor: 25, dataHoraInicio: new Date('2026-06-10T15:00:00') }),
    turno({ status: StatusAgendamento.CANCELADO, valor: 999, dataHoraInicio: new Date('2026-06-10T18:00:00') }),
  ];
  const serie = serieFaturamento(turnos, 'dia');
  assert.deepEqual(serie, [
    { periodo: '2026-06-10', total: 75 },
    { periodo: '2026-06-11', total: 100 },
  ]);
});

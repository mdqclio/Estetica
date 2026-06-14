import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryReporteDto } from './dto/query-reporte.dto';
import {
  TurnoCalc,
  faturamentoTotal,
  contarPorStatus,
  ticketMedio,
  taxaCancelamento,
  faturamentoPorServico,
  faturamentoPorProfissional,
  granularidade,
  serieFaturamento,
} from './reportes.calc';

// 'YYYY-MM-DD' -> límites del día en hora local
function parseInicio(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
function parseFim(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  private rango(query: QueryReporteDto) {
    const start = parseInicio(query.desde);
    const end = parseFim(query.hasta);
    if (end < start) {
      throw new BadRequestException('A data inicial deve ser anterior à data final.');
    }
    return { start, end };
  }

  private async fetchTurnos(start: Date, end: Date): Promise<TurnoCalc[]> {
    const turnos = await this.prisma.agendamento.findMany({
      where: { dataHoraInicio: { gte: start, lte: end } },
      select: {
        status: true,
        valor: true,
        dataHoraInicio: true,
        servico: { select: { id: true, nome: true } },
        profissional: { select: { id: true, nome: true } },
      },
    });
    return turnos.map((t) => ({
      status: t.status,
      valor: Number(t.valor),
      dataHoraInicio: t.dataHoraInicio,
      servicoId: t.servico.id,
      servicoNome: t.servico.nome,
      profissionalId: t.profissional.id,
      profissionalNome: t.profissional.nome,
    }));
  }

  async resumen(query: QueryReporteDto) {
    const { start, end } = this.rango(query);
    const turnos = await this.fetchTurnos(start, end);

    // Período anterior equivalente (mismo largo, inmediatamente antes)
    const durMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - durMs - 1);
    const turnosPrev = await this.fetchTurnos(prevStart, prevEnd);

    const faturamento = faturamentoTotal(turnos);
    const faturamentoPrev = faturamentoTotal(turnosPrev);
    const variacaoPct =
      faturamentoPrev > 0
        ? Math.round(((faturamento - faturamentoPrev) / faturamentoPrev) * 1000) /
          10
        : null;

    const gran = granularidade(start, end);

    return {
      periodo: { desde: query.desde, hasta: query.hasta },
      totalTurnos: turnos.length,
      turnosConcluidos: turnos.filter((t) => t.status === 'CONCLUIDO').length,
      faturamentoTotal: faturamento,
      ticketMedio: ticketMedio(turnos),
      taxaCancelamento: taxaCancelamento(turnos),
      turnosPorStatus: contarPorStatus(turnos),
      faturamentoPorServico: faturamentoPorServico(turnos),
      faturamentoPorProfissional: faturamentoPorProfissional(turnos),
      serie: { granularidade: gran, pontos: serieFaturamento(turnos, gran) },
      comparativa: {
        periodoAnterior: {
          desde: this.toISODate(prevStart),
          hasta: this.toISODate(prevEnd),
        },
        faturamentoAnterior: faturamentoPrev,
        variacaoPct,
      },
    };
  }

  async exportCsv(query: QueryReporteDto): Promise<string> {
    const r = await this.resumen(query);
    const lines: string[] = [];
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const row = (...cells: (string | number)[]) => lines.push(cells.map(esc).join(','));

    row('Relatório financeiro');
    row('Período', `${r.periodo.desde} a ${r.periodo.hasta}`);
    row('');
    row('Métrica', 'Valor');
    row('Faturamento total', r.faturamentoTotal);
    row('Ticket médio', r.ticketMedio);
    row('Total de agendamentos', r.totalTurnos);
    row('Agendamentos concluídos', r.turnosConcluidos);
    row('Taxa de cancelamento', r.taxaCancelamento);
    row('');
    row('Faturamento por serviço');
    row('Serviço', 'Faturamento', 'Quantidade');
    for (const s of r.faturamentoPorServico) row(s.nome, s.total, s.quantidade);
    row('');
    row('Faturamento por profissional');
    row('Profissional', 'Faturamento', 'Quantidade');
    for (const p of r.faturamentoPorProfissional) row(p.nome, p.total, p.quantidade);
    row('');
    row('Série de faturamento', `(por ${r.serie.granularidade})`);
    row('Período', 'Faturamento');
    for (const pt of r.serie.pontos) row(pt.periodo, pt.total);

    // BOM para que Excel respete UTF-8
    return '﻿' + lines.join('\n');
  }

  private toISODate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}

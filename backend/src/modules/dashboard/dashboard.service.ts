import { Injectable } from '@nestjs/common';
import { Perfil, Prisma, StatusAgendamento } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';

// ---- helpers de fecha (hora local del servidor) ----
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
// Lunes como inicio de semana
function startOfWeek(d: Date): Date {
  const base = startOfDay(d);
  const diff = (base.getDay() + 6) % 7; // 0=lunes … 6=domingo
  return addDays(base, -diff);
}
function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async metrics(user: JwtUser) {
    // El PROFISSIONAL solo ve métricas de su propia agenda.
    const scope: Prisma.AgendamentoWhereInput =
      user.perfil === Perfil.PROFISSIONAL ? { profissionalId: user.id } : {};

    const now = new Date();
    const inicioHoje = startOfDay(now);
    const fimHoje = addDays(inicioHoje, 1);
    const inicioSemana = startOfWeek(now);
    const fimSemana = addDays(inicioSemana, 7);

    const [
      clientesAtivos,
      turnosHoje,
      turnosSemana,
      statusGroups,
      proximosTurnos,
      concluidosSemana,
      servicosGroups,
      turnosSemanaList,
    ] = await Promise.all([
      this.prisma.cliente.count({ where: { ativo: true } }),
      this.prisma.agendamento.count({
        where: { ...scope, dataHoraInicio: { gte: inicioHoje, lt: fimHoje } },
      }),
      this.prisma.agendamento.count({
        where: {
          ...scope,
          dataHoraInicio: { gte: inicioSemana, lt: fimSemana },
        },
      }),
      this.prisma.agendamento.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      }),
      this.prisma.agendamento.findMany({
        where: {
          ...scope,
          dataHoraInicio: { gte: now },
          status: {
            in: [StatusAgendamento.AGENDADO, StatusAgendamento.CONFIRMADO],
          },
        },
        orderBy: { dataHoraInicio: 'asc' },
        take: 5,
        include: {
          cliente: { select: { id: true, nome: true } },
          servico: { select: { id: true, nome: true } },
          profissional: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.agendamento.findMany({
        where: {
          ...scope,
          status: StatusAgendamento.CONCLUIDO,
          dataHoraInicio: { gte: inicioSemana, lt: fimSemana },
        },
        include: { servico: { select: { preco: true } } },
      }),
      this.prisma.agendamento.groupBy({
        by: ['servicoId'],
        where: scope,
        _count: { _all: true },
        orderBy: { _count: { servicoId: 'desc' } },
        take: 5,
      }),
      this.prisma.agendamento.findMany({
        where: {
          ...scope,
          dataHoraInicio: { gte: inicioSemana, lt: fimSemana },
        },
        select: { dataHoraInicio: true },
      }),
    ]);

    // Turnos por status (con las 4 claves siempre presentes)
    const turnosPorStatus: Record<StatusAgendamento, number> = {
      AGENDADO: 0,
      CONFIRMADO: 0,
      CONCLUIDO: 0,
      CANCELADO: 0,
    };
    for (const g of statusGroups) {
      turnosPorStatus[g.status] = g._count._all;
    }

    // Facturación estimada del período (semana): suma de preco de servicios
    // en turnos CONCLUIDO.
    const faturamentoEstimado = concluidosSemana.reduce(
      (sum, a) => sum + Number(a.servico.preco),
      0,
    );

    // Servicios más solicitados (resolver nombres)
    const servicoIds = servicosGroups.map((g) => g.servicoId);
    const servicosInfo = await this.prisma.servico.findMany({
      where: { id: { in: servicoIds } },
      select: { id: true, nome: true },
    });
    const nomeById = new Map(servicosInfo.map((s) => [s.id, s.nome]));
    const servicosMaisSolicitados = servicosGroups.map((g) => ({
      servicoId: g.servicoId,
      nome: nomeById.get(g.servicoId) ?? '—',
      total: g._count._all,
    }));

    // Turnos por día de la semana actual (7 entradas, lunes→domingo)
    const turnosPorDia = Array.from({ length: 7 }, (_, i) => {
      const dia = addDays(inicioSemana, i);
      const key = isoDate(dia);
      const total = turnosSemanaList.filter(
        (t) => isoDate(t.dataHoraInicio) === key,
      ).length;
      return { data: key, total };
    });

    return {
      clientesAtivos,
      turnosHoje,
      turnosSemana,
      turnosPorStatus,
      proximosTurnos,
      faturamentoEstimado,
      servicosMaisSolicitados,
      turnosPorDia,
      periodo: { inicio: isoDate(inicioSemana), fim: isoDate(addDays(fimSemana, -1)) },
    };
  }
}

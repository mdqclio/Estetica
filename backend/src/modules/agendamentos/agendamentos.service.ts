import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Perfil, Prisma, StatusAgendamento } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';
import { QueryAgendamentoDto } from './dto/query-agendamento.dto';

// Datos relacionados que se devuelven junto al turno
const INCLUDE = {
  cliente: { select: { id: true, nome: true } },
  servico: {
    select: { id: true, nome: true, duracaoMinutos: true, preco: true },
  },
  profissional: { select: { id: true, nome: true } },
} satisfies Prisma.AgendamentoInclude;

@Injectable()
export class AgendamentosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAgendamentoDto, user: JwtUser) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AgendamentoWhereInput = {};

    // RBAC: el PROFISSIONAL solo ve su propia agenda; no puede mirar otras.
    if (user.perfil === Perfil.PROFISSIONAL) {
      where.profissionalId = user.id;
    } else if (query.profissionalId) {
      where.profissionalId = query.profissionalId;
    }

    if (query.clienteId) where.clienteId = query.clienteId;
    if (query.status) where.status = query.status;

    if (query.dataInicio || query.dataFim) {
      where.dataHoraInicio = {};
      if (query.dataInicio)
        where.dataHoraInicio.gte = new Date(query.dataInicio);
      if (query.dataFim) where.dataHoraInicio.lte = new Date(query.dataFim);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.agendamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataHoraInicio: 'asc' },
        include: INCLUDE,
      }),
      this.prisma.agendamento.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string, user: JwtUser) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    // El PROFISSIONAL solo puede ver turnos propios.
    if (
      user.perfil === Perfil.PROFISSIONAL &&
      agendamento.profissionalId !== user.id
    ) {
      throw new ForbiddenException('Você não tem acesso a este agendamento.');
    }
    return agendamento;
  }

  async create(dto: CreateAgendamentoDto) {
    await this.assertClienteExiste(dto.clienteId);
    const servico = await this.assertServicoExiste(dto.servicoId);
    await this.assertProfissionalValido(dto.profissionalId);

    const inicio = new Date(dto.dataHoraInicio);
    const fim = dto.dataHoraFim
      ? new Date(dto.dataHoraFim)
      : new Date(inicio.getTime() + servico.duracaoMinutos * 60_000);

    if (fim <= inicio) {
      throw new BadRequestException(
        'dataHoraFim deve ser posterior a dataHoraInicio.',
      );
    }

    await this.assertSemSolapamento(dto.profissionalId, inicio, fim);

    return this.prisma.agendamento.create({
      data: {
        clienteId: dto.clienteId,
        servicoId: dto.servicoId,
        profissionalId: dto.profissionalId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        // Snapshot del preco del servicio al crear el turno (base de los reportes).
        valor: servico.preco,
        observacoes: dto.observacoes,
        // status arranca en AGENDADO (default del schema)
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateAgendamentoDto) {
    const actual = await this.prisma.agendamento.findUnique({ where: { id } });
    if (!actual) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (dto.clienteId) await this.assertClienteExiste(dto.clienteId);
    if (dto.profissionalId)
      await this.assertProfissionalValido(dto.profissionalId);

    // Recalcular duración si cambia el servicio o el inicio y no se envía fin.
    const servicoId = dto.servicoId ?? actual.servicoId;
    const servico = await this.assertServicoExiste(servicoId);

    const inicio = dto.dataHoraInicio
      ? new Date(dto.dataHoraInicio)
      : actual.dataHoraInicio;

    let fim: Date;
    if (dto.dataHoraFim) {
      fim = new Date(dto.dataHoraFim);
    } else if (dto.dataHoraInicio || dto.servicoId) {
      fim = new Date(inicio.getTime() + servico.duracaoMinutos * 60_000);
    } else {
      fim = actual.dataHoraFim;
    }

    if (fim <= inicio) {
      throw new BadRequestException(
        'dataHoraFim deve ser posterior a dataHoraInicio.',
      );
    }

    const profissionalId = dto.profissionalId ?? actual.profissionalId;
    await this.assertSemSolapamento(profissionalId, inicio, fim, id);

    return this.prisma.agendamento.update({
      where: { id },
      data: {
        clienteId: dto.clienteId,
        servicoId: dto.servicoId,
        profissionalId: dto.profissionalId,
        dataHoraInicio: inicio,
        dataHoraFim: fim,
        // Si cambia el servicio, re-snapshot del nuevo preco; si no, se conserva.
        valor: dto.servicoId ? servico.preco : undefined,
        observacoes: dto.observacoes,
      },
      include: INCLUDE,
    });
  }

  async updateStatus(id: string, status: StatusAgendamento) {
    const actual = await this.prisma.agendamento.findUnique({ where: { id } });
    if (!actual) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    return this.prisma.agendamento.update({
      where: { id },
      data: { status },
      include: INCLUDE,
    });
  }

  // ---- helpers ----

  private async assertClienteExiste(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });
    if (!cliente) {
      throw new BadRequestException('O cliente indicado não existe.');
    }
    return cliente;
  }

  private async assertServicoExiste(servicoId: string) {
    const servico = await this.prisma.servico.findUnique({
      where: { id: servicoId },
    });
    if (!servico) {
      throw new BadRequestException('O serviço indicado não existe.');
    }
    return servico;
  }

  private async assertProfissionalValido(profissionalId: string) {
    const profissional = await this.prisma.usuario.findUnique({
      where: { id: profissionalId },
    });
    if (!profissional) {
      throw new BadRequestException('O profissional indicado não existe.');
    }
    if (profissional.perfil !== Perfil.PROFISSIONAL) {
      throw new BadRequestException(
        'O usuário atribuído não tem perfil PROFISSIONAL.',
      );
    }
    if (!profissional.ativo) {
      throw new BadRequestException('O profissional está inativo.');
    }
    return profissional;
  }

  // Dos turnos del mismo profesional no pueden pisarse en el tiempo.
  // Los CANCELADO no bloquean. Solapan si inicioA < finB && finA > inicioB.
  private async assertSemSolapamento(
    profissionalId: string,
    inicio: Date,
    fim: Date,
    ignoreId?: string,
  ) {
    const conflito = await this.prisma.agendamento.findFirst({
      where: {
        profissionalId,
        status: { not: StatusAgendamento.CANCELADO },
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        dataHoraInicio: { lt: fim },
        dataHoraFim: { gt: inicio },
      },
    });
    if (conflito) {
      throw new ConflictException(
        'Já existe um agendamento nesse horário para o profissional.',
      );
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { QueryServicoDto } from './dto/query-servico.dto';

@Injectable()
export class ServicosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryServicoDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ServicoWhereInput = {};

    if (query.ativo === 'true') where.ativo = true;
    if (query.ativo === 'false') where.ativo = false;

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { nome: { contains: s, mode: 'insensitive' } },
        { descricao: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.servico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.servico.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string) {
    const servico = await this.prisma.servico.findUnique({ where: { id } });
    if (!servico) {
      throw new NotFoundException('Serviço não encontrado');
    }
    return servico;
  }

  async create(dto: CreateServicoDto) {
    return this.prisma.servico.create({ data: dto });
  }

  async update(id: string, dto: UpdateServicoDto) {
    await this.findOne(id);
    return this.prisma.servico.update({ where: { id }, data: dto });
  }

  async inativar(id: string) {
    await this.findOne(id);
    return this.prisma.servico.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async reativar(id: string) {
    await this.findOne(id);
    return this.prisma.servico.update({
      where: { id },
      data: { ativo: true },
    });
  }
}

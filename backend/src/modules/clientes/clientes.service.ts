import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryClienteDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ClienteWhereInput = {};

    if (query.ativo === 'true') where.ativo = true;
    if (query.ativo === 'false') where.ativo = false;

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { nome: { contains: s, mode: 'insensitive' } },
        { cpf: { contains: s, mode: 'insensitive' } },
        { telefone: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.cliente.count({ where }),
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
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }

  async create(dto: CreateClienteDto) {
    await this.assertCpfUnico(dto.cpf);
    return this.prisma.cliente.create({
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento
          ? new Date(dto.dataNascimento)
          : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateClienteDto) {
    await this.findOne(id);
    if (dto.cpf) {
      await this.assertCpfUnico(dto.cpf, id);
    }
    return this.prisma.cliente.update({
      where: { id },
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento
          ? new Date(dto.dataNascimento)
          : undefined,
      },
    });
  }

  async inativar(id: string) {
    await this.findOne(id);
    return this.prisma.cliente.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async reativar(id: string) {
    await this.findOne(id);
    return this.prisma.cliente.update({
      where: { id },
      data: { ativo: true },
    });
  }

  private async assertCpfUnico(cpf: string, ignoreId?: string) {
    const existente = await this.prisma.cliente.findUnique({ where: { cpf } });
    if (existente && existente.id !== ignoreId) {
      throw new ConflictException('Ya existe un cliente con ese CPF');
    }
  }
}

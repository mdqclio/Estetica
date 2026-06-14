import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Perfil } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const SELECT = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({
      select: SELECT,
      orderBy: { nome: 'asc' },
    });
  }

  // Profesionales activos (id + nome) para selects de agendamentos.
  findProfissionais() {
    return this.prisma.usuario.findMany({
      where: { perfil: Perfil.PROFISSIONAL, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: SELECT,
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async create(dto: CreateUsuarioDto) {
    await this.assertEmailUnico(dto.email);
    const senhaHash = await bcrypt.hash(dto.senha, 10);
    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        perfil: dto.perfil,
        ativo: dto.ativo ?? true,
      },
      select: SELECT,
    });
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id);
    if (dto.email) {
      await this.assertEmailUnico(dto.email, id);
    }

    const data: any = {
      nome: dto.nome,
      email: dto.email,
      perfil: dto.perfil,
      ativo: dto.ativo,
    };
    if (dto.senha) {
      data.senhaHash = await bcrypt.hash(dto.senha, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: SELECT,
    });
  }

  async inativar(id: string) {
    await this.findOne(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { ativo: false },
      select: SELECT,
    });
  }

  private async assertEmailUnico(email: string, ignoreId?: string) {
    const existente = await this.prisma.usuario.findUnique({ where: { email } });
    if (existente && existente.id !== ignoreId) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
  }
}

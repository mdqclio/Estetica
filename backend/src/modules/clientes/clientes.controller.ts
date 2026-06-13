import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('clientes')
@UseGuards(RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // Todos los perfiles autenticados (lectura)
  @Get()
  findAll(@Query() query: QueryClienteDto) {
    return this.clientesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Post()
  @Roles(Perfil.ADMIN, Perfil.RECEPCIONISTA)
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Put(':id')
  @Roles(Perfil.ADMIN, Perfil.RECEPCIONISTA)
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Patch(':id/inativar')
  @Roles(Perfil.ADMIN, Perfil.RECEPCIONISTA)
  inativar(@Param('id') id: string) {
    return this.clientesService.inativar(id);
  }

  @Patch(':id/reativar')
  @Roles(Perfil.ADMIN)
  reativar(@Param('id') id: string) {
    return this.clientesService.reativar(id);
  }
}

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
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryAgendamentoDto } from './dto/query-agendamento.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  JwtUser,
} from '../../common/decorators/current-user.decorator';

@Controller('agendamentos')
@UseGuards(RolesGuard)
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  // Lectura: todos los perfiles. El PROFISSIONAL queda filtrado a su agenda
  // dentro del service.
  @Get()
  findAll(@Query() query: QueryAgendamentoDto, @CurrentUser() user: JwtUser) {
    return this.agendamentosService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.agendamentosService.findOne(id, user);
  }

  // Escritura y cambio de estado: ADMIN y RECEPCIONISTA (PROFISSIONAL es solo lectura)
  @Post()
  @Roles(Perfil.ADMIN, Perfil.RECEPCIONISTA)
  create(@Body() dto: CreateAgendamentoDto) {
    return this.agendamentosService.create(dto);
  }

  @Put(':id')
  @Roles(Perfil.ADMIN, Perfil.RECEPCIONISTA)
  update(@Param('id') id: string, @Body() dto: UpdateAgendamentoDto) {
    return this.agendamentosService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Perfil.ADMIN, Perfil.RECEPCIONISTA)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.agendamentosService.updateStatus(id, dto.status);
  }
}

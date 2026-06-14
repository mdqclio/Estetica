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
import { ServicosService } from './servicos.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { QueryServicoDto } from './dto/query-servico.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('servicos')
@UseGuards(RolesGuard)
export class ServicosController {
  constructor(private readonly servicosService: ServicosService) {}

  // Lectura: todos los perfiles autenticados
  @Get()
  findAll(@Query() query: QueryServicoDto) {
    return this.servicosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicosService.findOne(id);
  }

  // Escritura: solo ADMIN
  @Post()
  @Roles(Perfil.ADMIN)
  create(@Body() dto: CreateServicoDto) {
    return this.servicosService.create(dto);
  }

  @Put(':id')
  @Roles(Perfil.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateServicoDto) {
    return this.servicosService.update(id, dto);
  }

  @Patch(':id/inativar')
  @Roles(Perfil.ADMIN)
  inativar(@Param('id') id: string) {
    return this.servicosService.inativar(id);
  }

  @Patch(':id/reativar')
  @Roles(Perfil.ADMIN)
  reativar(@Param('id') id: string) {
    return this.servicosService.reativar(id);
  }
}

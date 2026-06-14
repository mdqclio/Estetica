import {
  Controller,
  Get,
  Header,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { ReportesService } from './reportes.service';
import { QueryReporteDto } from './dto/query-reporte.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

// Todo el módulo es exclusivo de ADMIN
@Controller('reportes')
@UseGuards(RolesGuard)
@Roles(Perfil.ADMIN)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // Reporte consolidado del período (todas las métricas en un payload).
  @Get('resumen')
  resumen(@Query() query: QueryReporteDto) {
    return this.reportesService.resumen(query);
  }

  // Exportación del reporte a CSV descargable.
  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="relatorio-financeiro.csv"',
  )
  async export(@Query() query: QueryReporteDto): Promise<StreamableFile> {
    const csv = await this.reportesService.exportCsv(query);
    return new StreamableFile(Buffer.from(csv, 'utf-8'));
  }
}

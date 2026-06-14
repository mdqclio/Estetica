import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  CurrentUser,
  JwtUser,
} from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Todos los perfiles autenticados. El PROFISSIONAL recibe métricas acotadas
  // a su propia agenda (filtrado en el service).
  @Get('metrics')
  metrics(@CurrentUser() user: JwtUser) {
    return this.dashboardService.metrics(user);
  }
}

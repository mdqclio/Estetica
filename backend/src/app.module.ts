import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ServicosModule } from './modules/servicos/servicos.module';
import { AgendamentosModule } from './modules/agendamentos/agendamentos.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportesModule } from './modules/reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientesModule,
    UsuariosModule,
    ServicosModule,
    AgendamentosModule,
    DashboardModule,
    ReportesModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ServicosModule } from './modules/servicos/servicos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientesModule,
    UsuariosModule,
    ServicosModule,
  ],
})
export class AppModule {}

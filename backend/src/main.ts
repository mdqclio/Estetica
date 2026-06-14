import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Variables de entorno obligatorias (falla rápido y claro si faltan en prod).
  for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
    if (!process.env[key]) {
      throw new Error(`Falta a variável de ambiente obrigatória: ${key}`);
    }
  }

  // Prefijo global
  app.setGlobalPrefix('api');

  // CORS para el frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Guard JWT global (rutas públicas usan @Public())
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Render asigna el puerto vía process.env.PORT; en local cae a 3001.
  const port = process.env.PORT || 3001;
  // Bind a 0.0.0.0 para que Render pueda enrutar el tráfico al contenedor.
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API escutando na porta ${port} (prefixo /api)`);
}
bootstrap();

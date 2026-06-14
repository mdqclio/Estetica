import { PrismaClient, Perfil, StatusAgendamento } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos...');

  // ---- Usuarios por defecto ----
  const usuarios = [
    {
      nome: 'Administrador',
      email: 'admin@estetica.com',
      senha: 'admin123',
      perfil: Perfil.ADMIN,
    },
    {
      nome: 'Recepción',
      email: 'recepcao@estetica.com',
      senha: 'recepcao123',
      perfil: Perfil.RECEPCIONISTA,
    },
    {
      nome: 'Profesional Ejemplo',
      email: 'profissional@estetica.com',
      senha: 'profissional123',
      perfil: Perfil.PROFISSIONAL,
    },
  ];

  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash(u.senha, 10);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, perfil: u.perfil, senhaHash, ativo: true },
      create: {
        nome: u.nome,
        email: u.email,
        senhaHash,
        perfil: u.perfil,
        ativo: true,
      },
    });
    console.log(`  ✓ Usuario: ${u.email} (${u.perfil})`);
  }

  // ---- Clientes de ejemplo ----
  const clientes = [
    {
      nome: 'Ana Pereira',
      cpf: '12345678901',
      telefone: '11999990001',
      email: 'ana.pereira@example.com',
      dataNascimento: new Date('1990-05-12'),
      endereco: 'Rua das Flores, 100 - São Paulo',
      observacoes: 'Alergia a productos con fragancia.',
    },
    {
      nome: 'Bruno Carvalho',
      cpf: '23456789012',
      telefone: '11999990002',
      email: 'bruno.carvalho@example.com',
      dataNascimento: new Date('1985-11-03'),
      endereco: 'Av. Paulista, 2000 - São Paulo',
      observacoes: 'Prefiere citas por la mañana.',
    },
    {
      nome: 'Carla Souza',
      cpf: '34567890123',
      telefone: '11999990003',
      email: 'carla.souza@example.com',
      dataNascimento: new Date('1998-02-20'),
      endereco: 'Rua Augusta, 500 - São Paulo',
      observacoes: '',
    },
  ];

  for (const c of clientes) {
    await prisma.cliente.upsert({
      where: { cpf: c.cpf },
      update: c,
      create: c,
    });
    console.log(`  ✓ Cliente: ${c.nome}`);
  }

  // ---- Servicios de ejemplo ----
  // `nome` no es único en el schema, así que upsert por nome vía findFirst
  // para que el seed sea idempotente.
  const servicos = [
    {
      nome: 'Limpeza de pele',
      descricao: 'Limpieza facial profunda con extracción.',
      duracaoMinutos: 60,
      preco: 120.0,
    },
    {
      nome: 'Massagem relaxante',
      descricao: 'Masaje corporal de relajación.',
      duracaoMinutos: 50,
      preco: 150.0,
    },
    {
      nome: 'Depilação a cera',
      descricao: 'Depilación con cera, media pierna.',
      duracaoMinutos: 30,
      preco: 80.0,
    },
    {
      nome: 'Design de sobrancelhas',
      descricao: 'Diseño y modelado de cejas.',
      duracaoMinutos: 20,
      preco: 45.0,
    },
    {
      nome: 'Manicure e pedicure',
      descricao: 'Manicura y pedicura completa.',
      duracaoMinutos: 75,
      preco: 90.0,
    },
  ];

  for (const s of servicos) {
    const existente = await prisma.servico.findFirst({
      where: { nome: s.nome },
    });
    if (existente) {
      await prisma.servico.update({ where: { id: existente.id }, data: s });
    } else {
      await prisma.servico.create({ data: s });
    }
    console.log(`  ✓ Servicio: ${s.nome}`);
  }

  // ---- Turnos (agendamentos) de ejemplo ----
  const profissional = await prisma.usuario.findUnique({
    where: { email: 'profissional@estetica.com' },
  });
  const ana = await prisma.cliente.findUnique({
    where: { cpf: '12345678901' },
  });
  const bruno = await prisma.cliente.findUnique({
    where: { cpf: '23456789012' },
  });
  const limpeza = await prisma.servico.findFirst({
    where: { nome: 'Limpeza de pele' },
  });
  const massagem = await prisma.servico.findFirst({
    where: { nome: 'Massagem relaxante' },
  });

  if (profissional && ana && bruno && limpeza && massagem) {
    const addMin = (d: Date, min: number) =>
      new Date(d.getTime() + min * 60_000);

    // Base: mañana a las 10:00 (hora local del entorno).
    const base = new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(10, 0, 0, 0);

    const turnos = [
      {
        cliente: ana,
        servico: limpeza,
        inicio: base,
        status: StatusAgendamento.AGENDADO,
        observacoes: 'Primera visita.',
      },
      {
        cliente: bruno,
        servico: massagem,
        inicio: addMin(base, 120), // +2h, sin solapar
        status: StatusAgendamento.CONFIRMADO,
        observacoes: '',
      },
      {
        cliente: ana,
        servico: massagem,
        inicio: addMin(base, -24 * 60), // ayer
        status: StatusAgendamento.CONCLUIDO,
        observacoes: 'Sesión completada.',
      },
    ];

    for (const t of turnos) {
      const existente = await prisma.agendamento.findFirst({
        where: {
          profissionalId: profissional.id,
          dataHoraInicio: t.inicio,
        },
      });
      const data = {
        clienteId: t.cliente.id,
        servicoId: t.servico.id,
        profissionalId: profissional.id,
        dataHoraInicio: t.inicio,
        dataHoraFim: addMin(t.inicio, t.servico.duracaoMinutos),
        status: t.status,
        observacoes: t.observacoes,
      };
      if (existente) {
        await prisma.agendamento.update({
          where: { id: existente.id },
          data,
        });
      } else {
        await prisma.agendamento.create({ data });
      }
      console.log(
        `  ✓ Turno: ${t.cliente.nome} · ${t.servico.nome} (${t.status})`,
      );
    }
  }

  console.log('✅ Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

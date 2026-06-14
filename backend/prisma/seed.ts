import { PrismaClient, Perfil, StatusAgendamento } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando banco de dados...');

  // ---- Usuários padrão ----
  const usuarios = [
    {
      nome: 'Administrador',
      email: 'admin@estetica.com',
      senha: 'admin123',
      perfil: Perfil.ADMIN,
    },
    {
      nome: 'Recepção',
      email: 'recepcao@estetica.com',
      senha: 'recepcao123',
      perfil: Perfil.RECEPCIONISTA,
    },
    {
      nome: 'Profissional Exemplo',
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
    console.log(`  ✓ Usuário: ${u.email} (${u.perfil})`);
  }

  // ---- Clientes de exemplo ----
  const clientes = [
    {
      nome: 'Ana Pereira',
      cpf: '12345678901',
      telefone: '11999990001',
      email: 'ana.pereira@example.com',
      dataNascimento: new Date('1990-05-12'),
      endereco: 'Rua das Flores, 100 - São Paulo',
      observacoes: 'Alergia a produtos com fragrância.',
    },
    {
      nome: 'Bruno Carvalho',
      cpf: '23456789012',
      telefone: '11999990002',
      email: 'bruno.carvalho@example.com',
      dataNascimento: new Date('1985-11-03'),
      endereco: 'Av. Paulista, 2000 - São Paulo',
      observacoes: 'Prefere horários pela manhã.',
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

  // ---- Serviços de exemplo ----
  // `nome` não é único no schema, então upsert por nome via findFirst
  // para que o seed seja idempotente.
  const servicos = [
    {
      nome: 'Limpeza de pele',
      descricao: 'Limpeza facial profunda com extração.',
      duracaoMinutos: 60,
      preco: 120.0,
    },
    {
      nome: 'Massagem relaxante',
      descricao: 'Massagem corporal de relaxamento.',
      duracaoMinutos: 50,
      preco: 150.0,
    },
    {
      nome: 'Depilação a cera',
      descricao: 'Depilação com cera, meia perna.',
      duracaoMinutos: 30,
      preco: 80.0,
    },
    {
      nome: 'Design de sobrancelhas',
      descricao: 'Design e modelagem de sobrancelhas.',
      duracaoMinutos: 20,
      preco: 45.0,
    },
    {
      nome: 'Manicure e pedicure',
      descricao: 'Manicure e pedicure completa.',
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
    console.log(`  ✓ Serviço: ${s.nome}`);
  }

  // ---- Agendamentos de exemplo ----
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

    // Base: amanhã às 10:00 (hora local do ambiente).
    const base = new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(10, 0, 0, 0);

    const turnos = [
      {
        cliente: ana,
        servico: limpeza,
        inicio: base,
        status: StatusAgendamento.AGENDADO,
        observacoes: 'Primeira visita.',
      },
      {
        cliente: bruno,
        servico: massagem,
        inicio: addMin(base, 120), // +2h, sem sobreposição
        status: StatusAgendamento.CONFIRMADO,
        observacoes: '',
      },
      {
        cliente: ana,
        servico: massagem,
        inicio: addMin(base, -24 * 60), // ontem
        status: StatusAgendamento.CONCLUIDO,
        observacoes: 'Sessão concluída.',
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
        valor: t.servico.preco, // snapshot do preço do serviço
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
        `  ✓ Agendamento: ${t.cliente.nome} · ${t.servico.nome} (${t.status})`,
      );
    }
  }

  console.log('✅ Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

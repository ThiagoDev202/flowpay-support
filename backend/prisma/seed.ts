// prisma/seed.ts
import { PrismaClient, TeamType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Times (idempotente via upsert)
  const cards = await prisma.team.upsert({
    where: { type: TeamType.CARDS },
    update: { name: 'Time Cartões' },
    create: { name: 'Time Cartões', type: TeamType.CARDS },
  });
  const loans = await prisma.team.upsert({
    where: { type: TeamType.LOANS },
    update: { name: 'Time Empréstimos' },
    create: { name: 'Time Empréstimos', type: TeamType.LOANS },
  });
  const other = await prisma.team.upsert({
    where: { type: TeamType.OTHER },
    update: { name: 'Time Outros Assuntos' },
    create: { name: 'Time Outros Assuntos', type: TeamType.OTHER },
  });

  // Atendentes — 3 por time
  const teams = [
    { team: cards, agents: ['Ana Souza', 'Carlos Lima', 'Beatriz Rocha'] },
    { team: loans, agents: ['Diego Alves', 'Fernanda Costa', 'Gabriel Santos'] },
    { team: other, agents: ['Helena Dias', 'Igor Mendes', 'Julia Ferreira'] },
  ];

  for (const { team, agents } of teams) {
    for (const name of agents) {
      await prisma.agent.upsert({
        where: { email: `${name.toLowerCase().replace(' ', '.')}@flowpay.com` },
        update: {
          name,
          teamId: team.id,
          isOnline: true,
          maxConcurrent: 3,
        },
        create: {
          name,
          email: `${name.toLowerCase().replace(' ', '.')}@flowpay.com`,
          teamId: team.id,
        },
      });
    }
  }

  console.log('✅ Seed concluído: 3 times, 9 atendentes');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

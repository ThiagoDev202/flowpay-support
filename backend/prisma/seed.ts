// prisma/seed.ts
import { PrismaClient, TeamType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Times
  const cards = await prisma.team.create({
    data: { name: 'Time Cartões', type: TeamType.CARDS },
  });
  const loans = await prisma.team.create({
    data: { name: 'Time Empréstimos', type: TeamType.LOANS },
  });
  const other = await prisma.team.create({
    data: { name: 'Time Outros Assuntos', type: TeamType.OTHER },
  });

  // Atendentes — 3 por time
  const teams = [
    { team: cards, agents: ['Ana Souza', 'Carlos Lima', 'Beatriz Rocha'] },
    { team: loans, agents: ['Diego Alves', 'Fernanda Costa', 'Gabriel Santos'] },
    { team: other, agents: ['Helena Dias', 'Igor Mendes', 'Julia Ferreira'] },
  ];

  for (const { team, agents } of teams) {
    for (const name of agents) {
      await prisma.agent.create({
        data: {
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

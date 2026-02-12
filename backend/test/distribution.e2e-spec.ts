import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamType, TicketStatus, TicketSubject } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Distribution Rules (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.ticket.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.team.deleteMany();

    const teams = await Promise.all([
      prisma.team.create({ data: { name: 'Time Cartões', type: TeamType.CARDS } }),
      prisma.team.create({
        data: { name: 'Time Empréstimos', type: TeamType.LOANS },
      }),
      prisma.team.create({
        data: { name: 'Time Outros Assuntos', type: TeamType.OTHER },
      }),
    ]);

    for (const team of teams) {
      for (let i = 1; i <= 3; i++) {
        await prisma.agent.create({
          data: {
            name: `${team.type}-Agente-${i}`,
            email: `${team.type.toLowerCase()}-${i}@flowpay.local`,
            teamId: team.id,
            maxConcurrent: 3,
            isOnline: true,
          },
        });
      }
    }
  });

  it('routes tickets by subject to correct team', async () => {
    const cases = [
      { subject: TicketSubject.CARD_PROBLEM, expectedTeam: TeamType.CARDS },
      { subject: TicketSubject.LOAN_REQUEST, expectedTeam: TeamType.LOANS },
      { subject: TicketSubject.OTHER, expectedTeam: TeamType.OTHER },
    ];

    for (const [index, testCase] of cases.entries()) {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          customerName: `Cliente-${index}-${Date.now()}`,
          subject: testCase.subject,
        })
        .expect(201);

      expect(response.body.status).toBe(TicketStatus.IN_PROGRESS);
      expect(response.body.agentId).toBeTruthy();

      const agent = await prisma.agent.findUnique({
        where: { id: response.body.agentId },
        include: { team: true },
      });

      expect(agent?.team.type).toBe(testCase.expectedTeam);
    }
  });

  it('enforces max 3 simultaneous tickets per agent and queues overflow', async () => {
    const createCount = 10; // 9 capacity in CARDS (3 agents * 3 each) + 1 queued

    for (let i = 0; i < createCount; i++) {
      await request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          customerName: `Cliente-cartao-${i}`,
          subject: TicketSubject.CARD_PROBLEM,
        })
        .expect(201);
    }

    const cardsAgents = await prisma.agent.findMany({
      where: { team: { type: TeamType.CARDS } },
      include: {
        currentTickets: { where: { status: TicketStatus.IN_PROGRESS } },
      },
    });

    const maxLoad = Math.max(...cardsAgents.map((agent) => agent.currentTickets.length));
    expect(maxLoad).toBe(3);

    const queued = await prisma.ticket.count({
      where: {
        status: TicketStatus.WAITING,
        subject: TicketSubject.CARD_PROBLEM,
      },
    });
    expect(queued).toBe(1);
  });

  it('processes queue in FIFO order when an agent becomes available', async () => {
    const createdTicketIds: string[] = [];

    for (let i = 0; i < 11; i++) {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          customerName: `Cliente-fifo-${i}`,
          subject: TicketSubject.CARD_PROBLEM,
        })
        .expect(201);
      createdTicketIds.push(response.body.id);
    }

    const waitingTickets = await prisma.ticket.findMany({
      where: {
        status: TicketStatus.WAITING,
        subject: TicketSubject.CARD_PROBLEM,
      },
      orderBy: { createdAt: 'asc' },
    });

    expect(waitingTickets.length).toBe(2);
    const firstInQueueId = waitingTickets[0].id;

    const inProgressTicket = await prisma.ticket.findFirst({
      where: {
        id: { in: createdTicketIds },
        status: TicketStatus.IN_PROGRESS,
      },
    });

    expect(inProgressTicket).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/api/tickets/${inProgressTicket!.id}/complete`)
      .expect(200);

    const promotedTicket = await prisma.ticket.findUnique({
      where: { id: firstInQueueId },
    });

    expect(promotedTicket?.status).toBe(TicketStatus.IN_PROGRESS);
    expect(promotedTicket?.queuePosition).toBeNull();
  });

  it('keeps dashboard stats consistent with ticket statuses', async () => {
    const ticketA = await request(app.getHttpServer())
      .post('/api/tickets')
      .send({
        customerName: 'Cliente-A',
        subject: TicketSubject.CARD_PROBLEM,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/tickets')
      .send({
        customerName: 'Cliente-B',
        subject: TicketSubject.LOAN_REQUEST,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/tickets/${ticketA.body.id}/complete`)
      .expect(200);

    const [statsResponse, ticketsResponse] = await Promise.all([
      request(app.getHttpServer()).get('/api/dashboard/stats').expect(200),
      request(app.getHttpServer()).get('/api/tickets').expect(200),
    ]);

    const tickets = ticketsResponse.body as Array<{ status: TicketStatus }>;
    const inProgress = tickets.filter(
      (ticket) => ticket.status === TicketStatus.IN_PROGRESS,
    ).length;
    const inQueue = tickets.filter((ticket) => ticket.status === TicketStatus.WAITING).length;
    const completed = tickets.filter((ticket) => ticket.status === TicketStatus.COMPLETED).length;

    expect(statsResponse.body.totalTickets).toBe(tickets.length);
    expect(statsResponse.body.inProgress).toBe(inProgress);
    expect(statsResponse.body.inQueue).toBe(inQueue);
    expect(statsResponse.body.completed).toBe(completed);
  });
});

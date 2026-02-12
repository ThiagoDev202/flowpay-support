import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamType, TicketStatus, TicketSubject } from '@prisma/client';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

function waitForEvent<T>(socket: Socket, eventName: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeoutMs);

    socket.once(eventName, (payload: T) => {
      clearTimeout(timeoutId);
      resolve(payload);
    });
  });
}

describe('WebSocket Events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientSocket: Socket;
  let serverUrl: string;
  let cardsAgentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address();
    serverUrl = `http://localhost:${address.port}`;

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.ticket.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.team.deleteMany();

    const [cards, loans, other] = await Promise.all([
      prisma.team.create({ data: { name: 'Time Cartões', type: TeamType.CARDS } }),
      prisma.team.create({
        data: { name: 'Time Empréstimos', type: TeamType.LOANS },
      }),
      prisma.team.create({
        data: { name: 'Time Outros Assuntos', type: TeamType.OTHER },
      }),
    ]);

    const cardsAgent = await prisma.agent.create({
      data: {
        name: 'Agente Cartões',
        email: 'cards@flowpay.local',
        teamId: cards.id,
        isOnline: true,
      },
    });
    cardsAgentId = cardsAgent.id;

    await prisma.agent.create({
      data: {
        name: 'Agente Empréstimos',
        email: 'loans@flowpay.local',
        teamId: loans.id,
        isOnline: true,
      },
    });

    await prisma.agent.create({
      data: {
        name: 'Agente Outros',
        email: 'other@flowpay.local',
        teamId: other.id,
        isOnline: true,
      },
    });

    clientSocket = io(`${serverUrl}/ws`, {
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      clientSocket.on('connect', () => resolve());
      clientSocket.on('connect_error', (error) => reject(error));
    });
  });

  afterEach(() => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
  });

  it('emits ticket lifecycle and dashboard stats events', async () => {
    const createdEventPromise = waitForEvent<{
      ticket: { id: string; customerName: string };
    }>(clientSocket, 'ticket:created');
    const assignedEventPromise = waitForEvent<{
      ticket: { id: string; status: string };
      agent: { id: string };
    }>(clientSocket, 'ticket:assigned');
    const statsEventPromise = waitForEvent<{
      stats: {
        totalTickets: number;
        inProgress: number;
        inQueue: number;
        completed: number;
      };
    }>(clientSocket, 'dashboard:stats');

    const createResponse = await request(app.getHttpServer())
      .post('/api/tickets')
      .send({
        customerName: 'Cliente WS',
        subject: TicketSubject.CARD_PROBLEM,
      })
      .expect(201);

    const [createdEvent, assignedEvent, statsEvent] = await Promise.all([
      createdEventPromise,
      assignedEventPromise,
      statsEventPromise,
    ]);

    expect(createdEvent.ticket.id).toBe(createResponse.body.id);
    expect(assignedEvent.ticket.id).toBe(createResponse.body.id);
    expect(assignedEvent.ticket.status).toBe('IN_PROGRESS');
    expect(statsEvent.stats.totalTickets).toBeGreaterThanOrEqual(1);
  });

  it('emits queue:updated and ticket:completed when queue is processed', async () => {
    // Fill agent capacity (maxConcurrent default = 3)
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          customerName: `Cliente lotado ${i}`,
          subject: TicketSubject.CARD_PROBLEM,
        })
        .expect(201);
    }

    const queueUpdatedPromise = waitForEvent<{
      teamType: TeamType;
      queueSize: number;
    }>(clientSocket, 'queue:updated');

    const queuedTicket = await request(app.getHttpServer())
      .post('/api/tickets')
      .send({
        customerName: 'Cliente na fila',
        subject: TicketSubject.CARD_PROBLEM,
      })
      .expect(201);

    const queueUpdated = await queueUpdatedPromise;
    expect(queueUpdated.teamType).toBe(TeamType.CARDS);
    expect(queueUpdated.queueSize).toBeGreaterThanOrEqual(1);
    expect(queuedTicket.body.status).toBe('WAITING');

    const activeTicket = await prisma.ticket.findFirstOrThrow({
      where: {
        subject: TicketSubject.CARD_PROBLEM,
        status: TicketStatus.IN_PROGRESS,
        agentId: cardsAgentId,
      },
    });

    const completedPromise = waitForEvent<{
      ticket: { id: string; status: string };
    }>(clientSocket, 'ticket:completed');

    await request(app.getHttpServer())
      .patch(`/api/tickets/${activeTicket.id}/complete`)
      .expect(200);

    const completedEvent = await completedPromise;
    expect(completedEvent.ticket.id).toBe(activeTicket.id);
    expect(completedEvent.ticket.status).toBe('COMPLETED');
  });

  it('emits agent:status-changed when status is updated', async () => {
    const agentStatusPromise = waitForEvent<{
      agent: { id: string; isOnline: boolean };
      activeCount: number;
    }>(clientSocket, 'agent:status-changed');

    await request(app.getHttpServer())
      .patch(`/api/agents/${cardsAgentId}/status`)
      .send({ isOnline: false })
      .expect(200);

    const event = await agentStatusPromise;
    expect(event.agent.id).toBe(cardsAgentId);
    expect(event.agent.isOnline).toBe(false);
    expect(typeof event.activeCount).toBe('number');
  });
});

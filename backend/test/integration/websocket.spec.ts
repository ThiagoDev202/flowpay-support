import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { TicketStatus, TicketSubject, TeamType } from '@prisma/client';

describe('WebSocket Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientSocket: Socket;
  let serverUrl: string;

  let teamCardsId: string;
  let teamLoansId: string;
  let agentCardsId: string;
  let agentLoansId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    await app.listen(0); // Porta aleatória

    const address = app.getHttpServer().address();
    const port = address.port;
    serverUrl = `http://localhost:${port}`;

    prisma = app.get<PrismaService>(PrismaService);

    // Limpa o banco antes de começar
    await prisma.ticket.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.team.deleteMany();

    // Cria dados de teste
    const teamCards = await prisma.team.create({
      data: {
        name: 'Time Cartões',
        type: TeamType.CARDS,
      },
    });
    teamCardsId = teamCards.id;

    const teamLoans = await prisma.team.create({
      data: {
        name: 'Time Empréstimos',
        type: TeamType.LOANS,
      },
    });
    teamLoansId = teamLoans.id;

    const agentCards = await prisma.agent.create({
      data: {
        name: 'João Silva',
        email: 'joao.silva@flowpay.com',
        teamId: teamCardsId,
        isOnline: true,
        maxConcurrent: 3,
      },
    });
    agentCardsId = agentCards.id;

    const agentLoans = await prisma.agent.create({
      data: {
        name: 'Maria Santos',
        email: 'maria.santos@flowpay.com',
        teamId: teamLoansId,
        isOnline: true,
        maxConcurrent: 3,
      },
    });
    agentLoansId = agentLoans.id;
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach((done) => {
    // Conecta cliente WebSocket antes de cada teste
    clientSocket = io(`${serverUrl}/ws`, {
      transports: ['websocket'],
      reconnection: false,
    });

    clientSocket.on('connect', () => {
      done();
    });

    clientSocket.on('connect_error', (error) => {
      done(error);
    });
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Conexão WebSocket', () => {
    it('deve conectar cliente via WebSocket', () => {
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Evento ticket:created', () => {
    it('deve emitir evento ticket:created ao criar ticket', (done) => {
      clientSocket.on('ticket:created', (data) => {
        expect(data).toHaveProperty('ticket');
        expect(data.ticket).toHaveProperty('id');
        expect(data.ticket).toHaveProperty('customerName', 'Cliente Teste');
        expect(data.ticket).toHaveProperty('subject', TicketSubject.CARD_PROBLEM);
        done();
      });

      // Cria ticket via API
      request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          customerName: 'Cliente Teste',
          subject: TicketSubject.CARD_PROBLEM,
        })
        .expect(201)
        .catch(done);
    });
  });

  describe('Evento ticket:assigned', () => {
    it('deve emitir evento ticket:assigned ao atribuir ticket', (done) => {
      clientSocket.on('ticket:assigned', (data) => {
        expect(data).toHaveProperty('ticket');
        expect(data).toHaveProperty('agent');
        expect(data.ticket.status).toBe(TicketStatus.IN_PROGRESS);
        expect(data.agent).toHaveProperty('id', agentCardsId);
        expect(data.agent).toHaveProperty('name', 'João Silva');
        done();
      });

      // Cria ticket que será automaticamente atribuído
      request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          customerName: 'Cliente Atribuído',
          subject: TicketSubject.CARD_PROBLEM,
        })
        .expect(201)
        .catch(done);
    });
  });

  describe('Evento ticket:completed', () => {
    it('deve emitir evento ticket:completed ao completar ticket', async () => {
      // Cria ticket primeiro
      const createResponse = await request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          customerName: 'Cliente Completar',
          subject: TicketSubject.LOAN_REQUEST,
        })
        .expect(201);

      const ticketId = createResponse.body.id;

      // Aguarda o ticket ser atribuído
      await new Promise((resolve) => setTimeout(resolve, 500));

      return new Promise<void>((resolve, reject) => {
        clientSocket.on('ticket:completed', (data) => {
          try {
            expect(data).toHaveProperty('ticket');
            expect(data).toHaveProperty('agent');
            expect(data.ticket.id).toBe(ticketId);
            expect(data.ticket.status).toBe(TicketStatus.COMPLETED);
            expect(data.agent).toHaveProperty('name', 'Maria Santos');
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        // Completa o ticket
        request(app.getHttpServer())
          .patch(`/api/tickets/${ticketId}/complete`)
          .expect(200)
          .catch(reject);
      });
    });
  });

  describe('Evento queue:updated', () => {
    it('deve emitir evento queue:updated ao enfileirar ticket', async () => {
      // Primeiro, deixa todos os agentes do time de cartões ocupados
      // Cria 3 tickets para ocupar o agente
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/tickets')
          .send({
            customerName: `Cliente ${i}`,
            subject: TicketSubject.CARD_PROBLEM,
          })
          .expect(201);
      }

      // Aguarda processamento
      await new Promise((resolve) => setTimeout(resolve, 500));

      return new Promise<void>((resolve, reject) => {
        clientSocket.on('queue:updated', (data) => {
          try {
            expect(data).toHaveProperty('teamType', TeamType.CARDS);
            expect(data).toHaveProperty('queueSize');
            expect(data.queueSize).toBeGreaterThanOrEqual(1);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        // Cria ticket que vai para a fila
        request(app.getHttpServer())
          .post('/api/tickets')
          .send({
            customerName: 'Cliente Fila',
            subject: TicketSubject.CARD_PROBLEM,
          })
          .expect(201)
          .catch(reject);
      });
    });
  });

  describe('Evento agent:status-changed', () => {
    it('deve emitir evento agent:status-changed ao mudar status', (done) => {
      clientSocket.on('agent:status-changed', (data) => {
        expect(data).toHaveProperty('agent');
        expect(data).toHaveProperty('activeCount');
        expect(data.agent).toHaveProperty('id', agentCardsId);
        expect(data.agent.isOnline).toBe(false);
        done();
      });

      // Muda status do agente
      request(app.getHttpServer())
        .patch(`/api/agents/${agentCardsId}/status`)
        .send({
          isOnline: false,
        })
        .expect(200)
        .catch(done);
    });
  });

  describe('Dashboard Endpoints', () => {
    it('GET /api/dashboard/stats deve retornar dados corretos', async () => {
      const response = await request(app.getHttpServer()).get('/api/dashboard/stats').expect(200);

      expect(response.body).toHaveProperty('totalTickets');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('inQueue');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('avgWaitTime');
      expect(typeof response.body.totalTickets).toBe('number');
      expect(typeof response.body.avgWaitTime).toBe('number');
    });

    it('GET /api/dashboard/teams deve retornar 3 times', async () => {
      const response = await request(app.getHttpServer()).get('/api/dashboard/teams').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      response.body.forEach((team: any) => {
        expect(team).toHaveProperty('teamId');
        expect(team).toHaveProperty('teamName');
        expect(team).toHaveProperty('teamType');
        expect(team).toHaveProperty('activeTickets');
        expect(team).toHaveProperty('queueSize');
        expect(team).toHaveProperty('availableAgents');
        expect(team).toHaveProperty('totalAgents');
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '@/modules/queue/queue.service';
import { PrismaService } from '@/database/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { TicketSubject, TeamType, TicketStatus } from '@prisma/client';

describe('QueueService', () => {
  let service: QueueService;
  let prismaService: PrismaService;

  // Mocks das filas BullMQ
  const mockQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
    getJobCounts: jest.fn(),
  };

  // Mock do PrismaService
  const mockPrismaService = {
    agent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('cards-queue'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('loans-queue'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('other-queue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapSubjectToTeam', () => {
    it('✅ deve mapear CARD_PROBLEM para CARDS', () => {
      const result = service.mapSubjectToTeam(TicketSubject.CARD_PROBLEM);
      expect(result).toBe(TeamType.CARDS);
    });

    it('✅ deve mapear LOAN_REQUEST para LOANS', () => {
      const result = service.mapSubjectToTeam(TicketSubject.LOAN_REQUEST);
      expect(result).toBe(TeamType.LOANS);
    });

    it('✅ deve mapear OTHER para OTHER', () => {
      const result = service.mapSubjectToTeam(TicketSubject.OTHER);
      expect(result).toBe(TeamType.OTHER);
    });
  });

  describe('findAvailableAgent', () => {
    it('✅ deve retornar agente com menor carga', async () => {
      // Mock de 3 agentes: um com 0 tickets, um com 1, um com 2
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          maxConcurrent: 3,
          currentTickets: [{ id: 'ticket-1' }], // 1 ticket
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          maxConcurrent: 3,
          currentTickets: [], // 0 tickets (menor carga)
        },
        {
          id: 'agent-3',
          name: 'Agent 3',
          maxConcurrent: 3,
          currentTickets: [{ id: 'ticket-2' }, { id: 'ticket-3' }], // 2 tickets
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.findAvailableAgent(TeamType.CARDS);

      expect(result).toBeDefined();
      expect(result.id).toBe('agent-2');
      expect((result as any).currentTickets.length).toBe(0);
      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith({
        where: {
          isOnline: true,
          team: {
            type: TeamType.CARDS,
          },
        },
        include: {
          currentTickets: {
            where: {
              status: TicketStatus.IN_PROGRESS,
            },
          },
        },
      });
    });

    it('✅ deve retornar null se todos os agentes estão com 3 tickets', async () => {
      // Mock de agentes todos com 3 tickets (carga máxima)
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          maxConcurrent: 3,
          currentTickets: [
            { id: 'ticket-1' },
            { id: 'ticket-2' },
            { id: 'ticket-3' },
          ],
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          maxConcurrent: 3,
          currentTickets: [
            { id: 'ticket-4' },
            { id: 'ticket-5' },
            { id: 'ticket-6' },
          ],
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.findAvailableAgent(TeamType.CARDS);

      expect(result).toBeNull();
    });

    it('✅ deve retornar null se não há agentes online', async () => {
      mockPrismaService.agent.findMany.mockResolvedValue([]);

      const result = await service.findAvailableAgent(TeamType.CARDS);

      expect(result).toBeNull();
    });
  });

  describe('assignTicketToAgent', () => {
    it('✅ deve atualizar ticket corretamente', async () => {
      const mockTicket = {
        id: 'ticket-1',
        customerName: 'John Doe',
        subject: TicketSubject.CARD_PROBLEM,
        status: TicketStatus.IN_PROGRESS,
        agentId: 'agent-1',
        agent: {
          id: 'agent-1',
          name: 'Agent 1',
          email: 'agent1@flowpay.com',
        },
        startedAt: new Date(),
        queuePosition: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.ticket.update.mockResolvedValue(mockTicket);

      const result = await service.assignTicketToAgent('ticket-1', 'agent-1');

      expect(result).toBeDefined();
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
      expect(result.agentId).toBe('agent-1');
      expect(result.queuePosition).toBeNull();
      expect(result.startedAt).toBeDefined();
      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: {
          agentId: 'agent-1',
          status: TicketStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
          queuePosition: null,
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('distributeTicket', () => {
    it('✅ deve atribuir ticket a agente disponível', async () => {
      const mockTicket = {
        id: 'ticket-1',
        customerName: 'John Doe',
        subject: TicketSubject.CARD_PROBLEM,
        status: TicketStatus.WAITING,
        agentId: null,
        queuePosition: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAgent = {
        id: 'agent-1',
        name: 'Agent 1',
        maxConcurrent: 3,
        currentTickets: [],
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        agentId: 'agent-1',
        startedAt: new Date(),
        agent: {
          id: 'agent-1',
          name: 'Agent 1',
          email: 'agent1@flowpay.com',
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.agent.findMany.mockResolvedValue([mockAgent]);
      mockPrismaService.ticket.update.mockResolvedValue(mockUpdatedTicket);

      await service.distributeTicket('ticket-1');

      expect(mockPrismaService.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
      });
      expect(mockPrismaService.agent.findMany).toHaveBeenCalled();
      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
          data: expect.objectContaining({
            agentId: 'agent-1',
            status: TicketStatus.IN_PROGRESS,
          }),
        }),
      );
    });

    it('✅ deve enfileirar ticket se não há agentes disponíveis', async () => {
      const mockTicket = {
        id: 'ticket-1',
        customerName: 'John Doe',
        subject: TicketSubject.CARD_PROBLEM,
        status: TicketStatus.WAITING,
        agentId: null,
        queuePosition: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Todos os agentes estão ocupados
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          maxConcurrent: 3,
          currentTickets: [{ id: '1' }, { id: '2' }, { id: '3' }],
        },
      ];

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        queuePosition: 1,
      });

      await service.distributeTicket('ticket-1');

      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: {
          queuePosition: 1,
          status: TicketStatus.WAITING,
        },
      });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'distribute-ticket',
        {
          ticketId: 'ticket-1',
          teamType: TeamType.CARDS,
        },
        {
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    });
  });

  describe('dequeueNext (FIFO)', () => {
    it('✅ deve retornar o primeiro ticket da fila (FIFO)', async () => {
      const now = new Date();
      const olderDate = new Date(now.getTime() - 60000); // 1 minuto antes
      const newerDate = new Date(now.getTime() + 60000); // 1 minuto depois

      const oldestTicket = {
        id: 'ticket-1',
        customerName: 'First Customer',
        subject: TicketSubject.CARD_PROBLEM,
        status: TicketStatus.WAITING,
        createdAt: olderDate, // Mais antigo
        agentId: null,
      };

      mockPrismaService.team.findUnique.mockResolvedValue({
        id: 'team-1',
        type: TeamType.CARDS,
      });
      mockPrismaService.ticket.findFirst.mockResolvedValue(oldestTicket);

      const result = await service.dequeueNext(TeamType.CARDS);

      expect(result).toBeDefined();
      expect(result.id).toBe('ticket-1');
      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith({
        where: {
          status: TicketStatus.WAITING,
          subject: TicketSubject.CARD_PROBLEM,
        },
        orderBy: {
          createdAt: 'asc', // FIFO
        },
      });
    });

    it('✅ deve retornar null se não há tickets na fila', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue({
        id: 'team-1',
        type: TeamType.CARDS,
      });
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      const result = await service.dequeueNext(TeamType.CARDS);

      expect(result).toBeNull();
    });
  });

  describe('processQueue', () => {
    it('✅ deve distribuir próximo da fila automaticamente quando agente fica disponível', async () => {
      const mockTicket = {
        id: 'ticket-1',
        customerName: 'John Doe',
        subject: TicketSubject.CARD_PROBLEM,
        status: TicketStatus.WAITING,
        agentId: null,
        createdAt: new Date(),
      };

      const mockAgent = {
        id: 'agent-1',
        name: 'Agent 1',
        maxConcurrent: 3,
        currentTickets: [],
      };

      mockPrismaService.team.findUnique.mockResolvedValue({
        id: 'team-1',
        type: TeamType.CARDS,
      });
      mockPrismaService.ticket.findFirst.mockResolvedValueOnce(mockTicket);
      mockPrismaService.ticket.findFirst.mockResolvedValueOnce(null); // Segunda chamada retorna null
      mockPrismaService.agent.findMany
        .mockResolvedValueOnce([mockAgent]) // Primeira chamada: agente disponível
        .mockResolvedValueOnce([]); // Segunda chamada: sem agentes
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        agentId: 'agent-1',
        agent: mockAgent,
      });
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      await service.processQueue(TeamType.CARDS);

      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'agent-1',
            status: TicketStatus.IN_PROGRESS,
          }),
        }),
      );
    });

    it('✅ deve parar quando não há mais tickets na fila', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'Agent 1',
        maxConcurrent: 3,
        currentTickets: [],
      };

      mockPrismaService.team.findUnique.mockResolvedValue({
        id: 'team-1',
        type: TeamType.CARDS,
      });
      mockPrismaService.agent.findMany.mockResolvedValue([mockAgent]);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null); // Fila vazia

      await service.processQueue(TeamType.CARDS);

      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.ticket.update).not.toHaveBeenCalled();
    });

    it('✅ deve parar quando não há mais agentes disponíveis', async () => {
      const mockTicket = {
        id: 'ticket-1',
        customerName: 'John Doe',
        subject: TicketSubject.CARD_PROBLEM,
        status: TicketStatus.WAITING,
        agentId: null,
        createdAt: new Date(),
      };

      mockPrismaService.team.findUnique.mockResolvedValue({
        id: 'team-1',
        type: TeamType.CARDS,
      });
      mockPrismaService.agent.findMany.mockResolvedValue([]); // Sem agentes disponíveis
      mockPrismaService.ticket.findFirst.mockResolvedValue(mockTicket);

      await service.processQueue(TeamType.CARDS);

      // Não deve tentar atribuir se não há agentes
      expect(mockPrismaService.ticket.update).not.toHaveBeenCalled();
    });
  });
});

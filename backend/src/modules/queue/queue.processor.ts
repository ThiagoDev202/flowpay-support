import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from './queue.service';
import { TeamType } from '@prisma/client';

interface DistributeTicketJob {
  ticketId: string;
  teamType: TeamType;
}

@Processor('cards-queue', { concurrency: 1 })
export class CardsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(CardsQueueProcessor.name);

  constructor(private readonly queueService: QueueService) {
    super();
  }

  async process(job: Job<DistributeTicketJob>): Promise<void> {
    this.logger.log(`Processing job ${job.id} for ticket ${job.data.ticketId} (CARDS)`);

    try {
      await this.queueService.processQueueJob(job.data.ticketId);
      this.logger.log(`Job ${job.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }
}

@Processor('loans-queue', { concurrency: 1 })
export class LoansQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(LoansQueueProcessor.name);

  constructor(private readonly queueService: QueueService) {
    super();
  }

  async process(job: Job<DistributeTicketJob>): Promise<void> {
    this.logger.log(`Processing job ${job.id} for ticket ${job.data.ticketId} (LOANS)`);

    try {
      await this.queueService.processQueueJob(job.data.ticketId);
      this.logger.log(`Job ${job.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }
}

@Processor('other-queue', { concurrency: 1 })
export class OtherQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(OtherQueueProcessor.name);

  constructor(private readonly queueService: QueueService) {
    super();
  }

  async process(job: Job<DistributeTicketJob>): Promise<void> {
    this.logger.log(`Processing job ${job.id} for ticket ${job.data.ticketId} (OTHER)`);

    try {
      await this.queueService.processQueueJob(job.data.ticketId);
      this.logger.log(`Job ${job.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }
}

// Export all processors as a single class for module registration
export const QueueProcessor = [CardsQueueProcessor, LoansQueueProcessor, OtherQueueProcessor];

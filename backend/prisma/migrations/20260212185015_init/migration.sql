-- CreateEnum
CREATE TYPE "TicketSubject" AS ENUM ('CARD_PROBLEM', 'LOAN_REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('CARDS', 'LOANS', 'OTHER');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TeamType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "max_concurrent" INTEGER NOT NULL DEFAULT 3,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "subject" "TicketSubject" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'WAITING',
    "agent_id" TEXT,
    "completed_by_id" TEXT,
    "queue_position" INTEGER,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_type_key" ON "teams"("type");

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_subject_idx" ON "tickets"("subject");

-- CreateIndex
CREATE INDEX "tickets_agent_id_idx" ON "tickets"("agent_id");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

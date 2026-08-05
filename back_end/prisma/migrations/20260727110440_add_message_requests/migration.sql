-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING';

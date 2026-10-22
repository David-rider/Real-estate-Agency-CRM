-- AlterEnum: agent payout requests now await admin approval
ALTER TYPE "CommStatus" ADD VALUE IF NOT EXISTS 'REQUESTED';

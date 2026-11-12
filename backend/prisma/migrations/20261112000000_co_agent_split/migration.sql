-- Share of the agent-side commission that goes to the co-agent (percent). NULL = 50 when a co-agent is set.
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "coAgentSplit" DOUBLE PRECISION;

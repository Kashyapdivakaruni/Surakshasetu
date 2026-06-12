-- Add trackingToken column to AccidentCase for public /track/[token] URLs
-- This column is unique, nullable (existing rows get NULL), and indexed.
ALTER TABLE "AccidentCase" ADD COLUMN "trackingToken" TEXT;
CREATE UNIQUE INDEX "AccidentCase_trackingToken_key" ON "AccidentCase"("trackingToken");

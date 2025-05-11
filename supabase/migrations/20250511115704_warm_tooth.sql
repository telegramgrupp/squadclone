/*
  # Add coin transactions table and update user coins

  1. New Tables
    - `CoinTransaction`
      - `id` (uuid, primary key)
      - `userId` (references User)
      - `amount` (integer)
      - `type` (text)
      - `createdAt` (timestamp)
      
  2. Changes
    - Added coin transaction tracking
    - Added coin purchase history
*/

CREATE TABLE IF NOT EXISTS "CoinTransaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX "coin_transaction_user_id_idx" ON "CoinTransaction"("userId");

-- Enable RLS
ALTER TABLE "CoinTransaction" ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own transactions"
  ON "CoinTransaction"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can insert their own transactions"
  ON "CoinTransaction"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId"::text);
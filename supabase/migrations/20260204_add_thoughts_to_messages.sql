-- Migration: Add thoughts column to messages and update sender_type constraint
-- Date: 2026-02-04

-- 1. Add thoughts column
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS thoughts JSONB;

-- 2. Update sender_type constraint to allow 'ai_reasoning'
-- First, drop the old constraint if it exists (names may vary, checking common one)
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_sender_type_check;

-- Add updated constraint
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_type_check 
CHECK (sender_type IN ('landlord', 'tenant', 'ai_reasoning'));

-- 3. Add comment
COMMENT ON COLUMN messages.thoughts IS 'Stores AI reasoning steps (ThinkingStep array)';

-- Add unique constraint on gmail_message_id to prevent duplicates at database level
-- This ensures no duplicate messages can be inserted even if application logic fails

-- First, remove any existing duplicates (keep the oldest one)
DELETE FROM messages a
USING messages b
WHERE a.gmail_message_id = b.gmail_message_id
  AND a.gmail_message_id IS NOT NULL
  AND a.id > b.id;

-- Now add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS messages_gmail_message_id_unique 
ON messages(gmail_message_id) 
WHERE gmail_message_id IS NOT NULL;

-- Verify the constraint was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'messages'
  AND indexname = 'messages_gmail_message_id_unique';

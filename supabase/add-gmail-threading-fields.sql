-- =====================================================
-- Add Gmail Threading Fields
-- =====================================================
-- Adds fields to track Gmail message/thread IDs
-- for proper email threading in auto-replies
-- =====================================================

-- Add Gmail threading fields to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_auto_reply_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_gmail_thread ON tenants(gmail_thread_id) WHERE gmail_thread_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN tenants.gmail_thread_id IS 'Gmail thread ID for email threading (keeps conversation together)';
COMMENT ON COLUMN tenants.gmail_message_id IS 'Original Gmail message ID that started the conversation';
COMMENT ON COLUMN tenants.last_auto_reply_at IS 'Timestamp of last automatic AI reply sent';

-- Add auto_reply_enabled flag to tenants (allows disabling per conversation)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN tenants.auto_reply_enabled IS 'Whether AI auto-reply is enabled for this conversation (can be toggled off)';

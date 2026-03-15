-- Conversation Memory: summaries for long conversations
-- This allows AI to maintain context across 50+ messages without sending all history

create table if not exists conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null,
  summary text not null,
  messages_covered int not null default 0,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint uq_conversation_summary unique (user_id, tenant_id)
);

create index if not exists idx_convsummary_user_tenant
  on conversation_summaries (user_id, tenant_id);

-- RLS
alter table conversation_summaries enable row level security;

drop policy if exists "Users can manage own summaries" on conversation_summaries;
create policy "Users can manage own summaries"
  on conversation_summaries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

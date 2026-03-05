-- Per-user OAuth token storage
-- Replaces the single GMAIL_REFRESH_TOKEN env var with per-user DB rows

create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  access_token text,
  refresh_token text not null,
  token_type text default 'Bearer',
  scope text,
  expires_at timestamptz,
  gmail_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

create index if not exists idx_oauth_tokens_user_provider
  on public.oauth_tokens(user_id, provider);

create index if not exists idx_oauth_tokens_gmail_email
  on public.oauth_tokens(gmail_email);

-- Auto-update updated_at
create or replace function public.handle_oauth_tokens_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_oauth_tokens_updated
  before update on public.oauth_tokens
  for each row execute function public.handle_oauth_tokens_updated_at();

-- RLS
alter table public.oauth_tokens enable row level security;

create policy "Users can read own tokens"
  on public.oauth_tokens for select using (auth.uid() = user_id);
create policy "Users can insert own tokens"
  on public.oauth_tokens for insert with check (auth.uid() = user_id);
create policy "Users can update own tokens"
  on public.oauth_tokens for update using (auth.uid() = user_id);
create policy "Users can delete own tokens"
  on public.oauth_tokens for delete using (auth.uid() = user_id);

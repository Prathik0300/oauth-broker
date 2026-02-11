create table if not exists connections (
  id text primary key,
  provider text not null,
  subject text not null,
  scopes text not null,
  access_token_enc text not null,
  refresh_token_enc text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_connections_provider_subject
on connections(provider, subject);
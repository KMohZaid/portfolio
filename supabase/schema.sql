-- Run this in the Supabase SQL Editor for the project's database.
create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content jsonb not null,
  status text not null check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists blog_posts_published_order_idx
  on public.blog_posts (published_at desc nulls last, updated_at desc)
  where status = 'published';

create table if not exists public.blog_uploads (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  filename text not null,
  size integer not null check (size > 0),
  created_at timestamptz not null default now(),
  removed_at timestamptz
);

create index if not exists blog_uploads_created_order_idx
  on public.blog_uploads (created_at desc);

create table if not exists public.blog_login_tokens (
  jti uuid primary key,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create index if not exists blog_login_tokens_expiry_idx
  on public.blog_login_tokens (expires_at);

create table if not exists public.blog_admin_sessions (
  jti uuid primary key,
  email text not null,
  expires_at timestamptz not null
);

create index if not exists blog_admin_sessions_expiry_idx
  on public.blog_admin_sessions (expires_at);

create table if not exists public.blog_login_rate_limits (
  key text primary key,
  next_allowed_at timestamptz not null,
  requests integer not null default 1 check (requests > 0)
);

-- Atomically allows only one request per email key in the cooldown window.
create or replace function public.claim_blog_login_rate_limit(
  p_key text,
  p_now timestamptz,
  p_next_allowed_at timestamptz
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_key text;
  updated_key text;
begin
  insert into public.blog_login_rate_limits (key, next_allowed_at, requests)
  values (p_key, p_next_allowed_at, 1)
  on conflict (key) do nothing
  returning key into inserted_key;

  if inserted_key is not null then
    return true;
  end if;

  update public.blog_login_rate_limits
  set next_allowed_at = p_next_allowed_at, requests = requests + 1
  where key = p_key and next_allowed_at <= p_now
  returning key into updated_key;

  return updated_key is not null;
end;
$$;

-- Atomically removes the matching unexpired code so it can be used only once.
create or replace function public.consume_blog_login_code(
  p_email text,
  p_code_hash text,
  p_now timestamptz
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  matching_jti uuid;
  existing_jti uuid;
  attempt_count integer;
begin
  select jti, attempts into matching_jti, attempt_count
  from public.blog_login_tokens
  where email = p_email and expires_at > p_now
  order by created_at desc
  limit 1
  for update;

  if matching_jti is null then return false; end if;

  if attempt_count >= 5 then
    delete from public.blog_login_tokens where jti = matching_jti;
    return false;
  end if;

  if (select code_hash from public.blog_login_tokens where jti = matching_jti) <> p_code_hash then
    update public.blog_login_tokens set attempts = attempts + 1 where jti = matching_jti;
    return false;
  end if;

  delete from public.blog_login_tokens where jti = matching_jti returning jti into existing_jti;
  return existing_jti is not null;
end;
$$;

-- The application uses only the server-side service-role key. Keep tables
-- inaccessible to anon/authenticated clients and expose no client-side DB key.
alter table public.blog_posts enable row level security;
alter table public.blog_uploads enable row level security;
alter table public.blog_login_tokens enable row level security;
alter table public.blog_admin_sessions enable row level security;
alter table public.blog_login_rate_limits enable row level security;

revoke all on public.blog_posts, public.blog_uploads, public.blog_login_tokens,
  public.blog_admin_sessions, public.blog_login_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.blog_posts, public.blog_uploads,
  public.blog_login_tokens, public.blog_admin_sessions, public.blog_login_rate_limits to service_role;
revoke all on function public.claim_blog_login_rate_limit(text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_blog_login_rate_limit(text, timestamptz, timestamptz) to service_role;
revoke all on function public.consume_blog_login_code(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.consume_blog_login_code(text, text, timestamptz) to service_role;

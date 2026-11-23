-- CollabSpace Database Schema - Stage 7: User Profiles, Usernames, Bio & Storage
-- Run this migration in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Ensure UUID Extension is available
create extension if not exists "uuid-ossp";

-- 2. Create or Update 'profiles' table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  username text unique,
  avatar_url text,
  bio text default '',
  role text default 'Member' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ensure newly added columns exist if table was already created in earlier stages
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'username') then
    alter table public.profiles add column username text unique;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'bio') then
    alter table public.profiles add column bio text default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name') then
    alter table public.profiles add column full_name text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;

-- Add username format validation check constraint (3-30 characters, alphanumeric and underscore)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'profiles'
      and constraint_name = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username is null or (length(username) between 3 and 30 and username ~* '^[a-zA-Z0-9_]+$'));
  end if;
end $$;

-- Case-insensitive unique index on username
create unique index if not exists idx_profiles_username_lower
  on public.profiles (lower(username));

-- Index on full_name for member search
create index if not exists idx_profiles_full_name
  on public.profiles (full_name);

-- 3. Enable Row Level Security (RLS) - Mandatory
alter table public.profiles enable row level security;

-- 4. RLS Policies for Profiles
-- Public/Authenticated users can read profiles (needed for workspace collaboration, avatar stacks, member directories)
drop policy if exists "Allow authenticated users to read profiles" on public.profiles;
drop policy if exists "Allow authenticated users to read all profiles" on public.profiles;
create policy "Allow authenticated users to read profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Users can insert their own profile
drop policy if exists "Allow users to insert their own profile" on public.profiles;
create policy "Allow users to insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can update only their own profile
drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. Trigger function: Auto-create profile upon auth.users signup
-- Generates a valid unique username fallback if not explicitly provided during signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_name text;
  clean_username text;
  candidate_username text;
  is_taken boolean;
  suffix int := 0;
begin
  -- Resolve display name
  raw_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  
  -- Resolve or generate unique candidate username
  if new.raw_user_meta_data->>'username' is not null then
    candidate_username := lower(regexp_replace(new.raw_user_meta_data->>'username', '[^a-zA-Z0-9_]', '', 'g'));
  else
    clean_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
    if length(clean_username) < 3 then
      clean_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 4);
    end if;
    candidate_username := clean_username;

    -- Check if username already exists and append suffix if collision occurs
    loop
      select exists(select 1 from public.profiles where lower(username) = lower(candidate_username)) into is_taken;
      exit when not is_taken;
      suffix := suffix + 1;
      candidate_username := substr(clean_username, 1, 24) || '_' || suffix::text;
    end loop;
  end if;

  insert into public.profiles (
    id,
    full_name,
    username,
    avatar_url,
    bio,
    created_at,
    updated_at
  )
  values (
    new.id,
    raw_name,
    candidate_username,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'bio', ''),
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    bio = coalesce(excluded.bio, profiles.bio),
    updated_at = now();

  return new;
end;
$$;

-- Trigger definition on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Trigger function: Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 7. Storage Bucket for User Avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS Policies
-- A. Public read access for avatars
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Avatars are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- B. Authenticated users can upload an avatar into their own folder ({userId}/filename)
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- C. Authenticated users can update/replace their own avatar
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars' 
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- D. Authenticated users can delete their own avatar
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );


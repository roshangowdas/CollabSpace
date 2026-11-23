-- CollabSpace Database Schema - Stage 5: Authentication, Profiles & Storage
-- Run this migration in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create 'profiles' table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text default 'Member' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Enable Row Level Security (RLS) - Mandatory
alter table public.profiles enable row level security;

-- 4. RLS Policies for Profiles
-- Any authenticated user can read profiles (needed for workspace collaboration, avatar stacks, mentions)
create policy "Allow authenticated users to read all profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Users can insert their own profile
create policy "Allow users to insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can update only their own profile
create policy "Allow users to update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. Trigger function: Auto-create profile upon auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'Member',
    now(),
    now()
  );
  return new;
end;
$$;

-- 6. Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Trigger function: Auto-update updated_at timestamp
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

-- 8. Helpful indexes
create index if not exists idx_profiles_email on public.profiles (email);

-- 9. Storage bucket for user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Avatars RLS: Public can view avatars
create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload an avatar to their folder
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

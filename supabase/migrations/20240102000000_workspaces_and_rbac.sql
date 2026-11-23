-- CollabSpace Database Schema - Stage 6: Workspaces & Role-Based Access Control (RBAC)
-- Run this migration in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create 'workspaces' table
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Create 'workspace_members' table
create table if not exists public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('Owner', 'Admin', 'Member', 'Viewer')) default 'Member',
  created_at timestamptz default now() not null,
  unique(workspace_id, user_id)
);

-- 3. Create 'workspace_invitations' table
create table if not exists public.workspace_invitations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('Admin', 'Member', 'Viewer')) default 'Member',
  token text unique not null,
  invited_by uuid references auth.users(id) on delete cascade not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now() not null
);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;

-- 5. Helper function: Check if current user is member of a workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

-- 6. Helper function: Get current user's role in a workspace
create or replace function public.get_workspace_role(ws_id uuid)
returns text
language sql
security definer
stable
as $$
  select role
  from public.workspace_members
  where workspace_id = ws_id
    and user_id = auth.uid()
  limit 1;
$$;

-- 7. RLS Policies for 'workspaces'
-- Users can read workspaces they belong to
create policy "Members can view their workspaces"
  on public.workspaces
  for select
  to authenticated
  using (public.is_workspace_member(id));

-- Any authenticated user can create a workspace
create policy "Authenticated users can create workspaces"
  on public.workspaces
  for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Owners and Admins can update workspace details
create policy "Owners and Admins can update workspace"
  on public.workspaces
  for update
  to authenticated
  using (public.get_workspace_role(id) in ('Owner', 'Admin'))
  with check (public.get_workspace_role(id) in ('Owner', 'Admin'));

-- Only Owners can delete a workspace
create policy "Only Owners can delete workspace"
  on public.workspaces
  for delete
  to authenticated
  using (public.get_workspace_role(id) = 'Owner');

-- 8. RLS Policies for 'workspace_members'
-- Members can view other members in the same workspace
create policy "Members can view workspace member list"
  on public.workspace_members
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- Owners and Admins can add members
create policy "Owners and Admins can insert members"
  on public.workspace_members
  for insert
  to authenticated
  with check (public.get_workspace_role(workspace_id) in ('Owner', 'Admin'));

-- Owners and Admins can update member roles (Owners cannot be demoted except by themselves)
create policy "Owners and Admins can update member roles"
  on public.workspace_members
  for update
  to authenticated
  using (public.get_workspace_role(workspace_id) in ('Owner', 'Admin'))
  with check (public.get_workspace_role(workspace_id) in ('Owner', 'Admin'));

-- Owners, Admins, or members removing themselves can delete membership
create policy "Owners, Admins or user can remove membership"
  on public.workspace_members
  for delete
  to authenticated
  using (
    public.get_workspace_role(workspace_id) in ('Owner', 'Admin')
    or user_id = auth.uid()
  );

-- 9. Trigger: Automatically make workspace creator the 'Owner' in workspace_members
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new.id, new.created_by, 'Owner')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- 10. Auto-update updated_at trigger for workspaces
drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
  before update on public.workspaces
  for each row execute procedure public.handle_updated_at();

-- 11. Indexes for performance
create index if not exists idx_workspaces_slug on public.workspaces(slug);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_workspace_members_ws on public.workspace_members(workspace_id);
create index if not exists idx_workspace_invites_token on public.workspace_invitations(token);


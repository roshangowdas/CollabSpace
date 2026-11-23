-- ==============================================================================
-- CollabSpace Complete Production Database Schema
-- Migration: 20240104000000_complete_database_schema.sql
-- Description: Full schema for all 16 core tables, strict Row Level Security (RLS)
--              anti-recursion security-definer helper functions, automated triggers,
--              and performance indexes.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & UTILITIES
-- ------------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Generic Updated At Trigger Function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------------------
-- 2. TABLE DEFINITIONS
-- ------------------------------------------------------------------------------

-- 2.1 Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null check (length(trim(full_name)) >= 1),
  username text unique not null,
  avatar_url text,
  bio text default '',
  role text default 'Member' not null check (role in ('Owner', 'Admin', 'Member', 'Viewer')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint profiles_username_format_check check (
    length(username) between 3 and 30 and username ~* '^[a-zA-Z0-9_]+$'
  )
);

create unique index if not exists idx_profiles_username_lower
  on public.profiles (lower(username));
create index if not exists idx_profiles_full_name
  on public.profiles (full_name);

-- 2.2 Workspaces (Tenants)
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null check (length(trim(name)) >= 2 and length(name) <= 100),
  slug text unique not null check (length(slug) between 2 and 60 and slug ~* '^[a-z0-9-]+$'),
  description text default '',
  logo_url text,
  owner_id uuid references public.profiles(id) on delete restrict not null,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index if not exists idx_workspaces_slug_lower
  on public.workspaces (lower(slug));
create index if not exists idx_workspaces_owner
  on public.workspaces (owner_id);

-- 2.3 Workspace Members (RBAC)
create table if not exists public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('Owner', 'Admin', 'Member', 'Viewer')) default 'Member',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(workspace_id, user_id)
);

create index if not exists idx_workspace_members_ws
  on public.workspace_members (workspace_id);
create index if not exists idx_workspace_members_user
  on public.workspace_members (user_id);
create index if not exists idx_workspace_members_role
  on public.workspace_members (workspace_id, role);

-- 2.4 Invitations
create table if not exists public.invitations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role text not null check (role in ('Admin', 'Member', 'Viewer')) default 'Member',
  token text unique not null,
  invited_by uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')) not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_invitations_workspace
  on public.invitations (workspace_id);
create index if not exists idx_invitations_email
  on public.invitations (lower(email));
create index if not exists idx_invitations_token
  on public.invitations (token);

-- 2.5 Projects
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null check (length(trim(name)) >= 1 and length(name) <= 120),
  key text not null check (length(key) between 2 and 10 and key ~* '^[A-Z0-9]+$'),
  description text default '',
  status text default 'active' check (status in ('active', 'paused', 'completed', 'archived')) not null,
  visibility text default 'workspace' check (visibility in ('workspace', 'private')) not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(workspace_id, key)
);

create index if not exists idx_projects_workspace
  on public.projects (workspace_id);
create index if not exists idx_projects_status
  on public.projects (workspace_id, status);

-- 2.6 Project Members
create table if not exists public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('Lead', 'Contributor', 'Viewer')) default 'Contributor',
  created_at timestamptz default now() not null,
  unique(project_id, user_id)
);

create index if not exists idx_project_members_proj
  on public.project_members (project_id);
create index if not exists idx_project_members_user
  on public.project_members (user_id);

-- 2.7 Tasks (Kanban & Issues)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  task_number integer not null check (task_number > 0),
  title text not null check (length(trim(title)) >= 1 and length(title) <= 250),
  description text default '',
  status text not null default 'todo' check (status in ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references public.profiles(id) on delete set null,
  reporter_id uuid references public.profiles(id) on delete set null not null,
  due_date timestamptz,
  position double precision default 0 not null,
  labels text[] default '{}' not null,
  estimated_hours numeric(6, 2) check (estimated_hours is null or estimated_hours >= 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(project_id, task_number)
);

create index if not exists idx_tasks_project
  on public.tasks (project_id);
create index if not exists idx_tasks_workspace
  on public.tasks (workspace_id);
create index if not exists idx_tasks_status
  on public.tasks (project_id, status);
create index if not exists idx_tasks_assignee
  on public.tasks (assignee_id);
create index if not exists idx_tasks_reporter
  on public.tasks (reporter_id);
create index if not exists idx_tasks_due_date
  on public.tasks (due_date);

-- 2.8 Task Comments
create table if not exists public.task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (length(trim(content)) >= 1),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_task_comments_task
  on public.task_comments (task_id, created_at);
create index if not exists idx_task_comments_user
  on public.task_comments (user_id);

-- 2.9 Messages (Real-time Channels & Threads)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  channel_name text not null check (length(channel_name) between 1 and 60 and channel_name ~* '^[a-z0-9_-]+$'),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (length(trim(content)) >= 1),
  parent_id uuid references public.messages(id) on delete cascade,
  attachments jsonb default '[]'::jsonb not null,
  is_pinned boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_messages_ws_channel
  on public.messages (workspace_id, channel_name, created_at desc);
create index if not exists idx_messages_parent
  on public.messages (parent_id) where parent_id is not null;
create index if not exists idx_messages_sender
  on public.messages (sender_id);

-- 2.10 Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  title text not null check (length(trim(title)) >= 1),
  message text not null,
  type text not null check (type in ('mention', 'assignment', 'invitation', 'system', 'comment', 'status_change')),
  entity_type text check (entity_type in ('task', 'document', 'workspace', 'message', 'project', 'whiteboard')),
  entity_id uuid,
  link text,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_notifications_ws
  on public.notifications (workspace_id);

-- 2.11 Documents (Collaborative Specs & Wikis)
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  parent_id uuid references public.documents(id) on delete cascade,
  title text not null check (length(trim(title)) >= 1 and length(title) <= 250),
  content jsonb default '{"type":"doc","content":[]}'::jsonb not null,
  content_text text default '' not null,
  created_by uuid references public.profiles(id) on delete set null not null,
  last_edited_by uuid references public.profiles(id) on delete set null,
  is_archived boolean default false not null,
  is_template boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_documents_workspace
  on public.documents (workspace_id);
create index if not exists idx_documents_project
  on public.documents (project_id) where project_id is not null;
create index if not exists idx_documents_parent
  on public.documents (parent_id) where parent_id is not null;

-- 2.12 Document Updates (Version History & Snapshots)
create table if not exists public.document_updates (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null not null,
  version_number integer not null check (version_number > 0),
  patch jsonb not null,
  summary text default '',
  created_at timestamptz default now() not null,
  unique(document_id, version_number)
);

create index if not exists idx_document_updates_doc
  on public.document_updates (document_id, version_number desc);

-- 2.13 Whiteboards (Infinite Canvas)
create table if not exists public.whiteboards (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null check (length(trim(name)) >= 1 and length(name) <= 120),
  description text default '',
  thumbnail_url text,
  created_by uuid references public.profiles(id) on delete set null not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_whiteboards_workspace
  on public.whiteboards (workspace_id);
create index if not exists idx_whiteboards_project
  on public.whiteboards (project_id) where project_id is not null;

-- 2.14 Whiteboard Elements (Shapes, Sticky Notes, Connectors)
create table if not exists public.whiteboard_elements (
  id uuid default gen_random_uuid() primary key,
  whiteboard_id uuid references public.whiteboards(id) on delete cascade not null,
  element_type text not null check (
    element_type in ('rectangle', 'circle', 'arrow', 'line', 'text', 'sticky_note', 'image', 'path')
  ),
  properties jsonb not null default '{}'::jsonb,
  z_index integer default 0 not null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_whiteboard_elements_board
  on public.whiteboard_elements (whiteboard_id, z_index);

-- 2.15 Attachments (Files & Metadata)
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  uploader_id uuid references public.profiles(id) on delete set null not null,
  file_name text not null check (length(trim(file_name)) >= 1),
  file_size bigint not null check (file_size > 0),
  mime_type text not null,
  storage_path text not null,
  bucket_id text not null default 'workspace-files',
  task_id uuid references public.tasks(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  created_at timestamptz default now() not null
);

create index if not exists idx_attachments_workspace
  on public.attachments (workspace_id);
create index if not exists idx_attachments_task
  on public.attachments (task_id) where task_id is not null;
create index if not exists idx_attachments_document
  on public.attachments (document_id) where document_id is not null;

-- 2.16 Activity Logs (Immutable Audit Trail)
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check (
    action in ('created', 'updated', 'deleted', 'assigned', 'status_changed', 'commented', 'invited', 'joined', 'left', 'archived')
  ),
  entity_type text not null check (
    entity_type in ('workspace', 'member', 'project', 'task', 'comment', 'message', 'document', 'whiteboard', 'attachment')
  ),
  entity_id uuid not null,
  entity_title text default '',
  details jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_activity_logs_workspace
  on public.activity_logs (workspace_id, created_at desc);
create index if not exists idx_activity_logs_user
  on public.activity_logs (user_id);
create index if not exists idx_activity_logs_entity
  on public.activity_logs (entity_type, entity_id);

-- ------------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGERS
-- ------------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'profiles',
    'workspaces',
    'workspace_members',
    'invitations',
    'projects',
    'tasks',
    'task_comments',
    'messages',
    'documents',
    'whiteboards',
    'whiteboard_elements'
  ]) loop
    execute format('
      drop trigger if exists set_%I_updated_at on public.%I;
      create trigger set_%I_updated_at
        before update on public.%I
        for each row execute procedure public.handle_updated_at();
    ', tbl, tbl, tbl, tbl);
  end loop;
end $$;

-- ------------------------------------------------------------------------------
-- 4. BUSINESS LOGIC TRIGGERS
-- ------------------------------------------------------------------------------

-- 4.1 Auto-add Workspace Creator as 'Owner'
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'Owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- 4.2 Auto-add Project Creator as 'Lead'
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.project_members (project_id, user_id, role)
    values (new.id, new.created_by, 'Lead')
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute procedure public.handle_new_project();

-- 4.3 Auto-assign incremental task_number inside project
create or replace function public.handle_new_task_number()
returns trigger
language plpgsql
as $$
declare
  next_num integer;
begin
  if new.task_number is null or new.task_number = 0 then
    select coalesce(max(task_number), 0) + 1
    into next_num
    from public.tasks
    where project_id = new.project_id;

    new.task_number = next_num;
  end if;
  return new;
end;
$$;

drop trigger if exists on_task_before_insert on public.tasks;
create trigger on_task_before_insert
  before insert on public.tasks
  for each row execute procedure public.handle_new_task_number();

-- ------------------------------------------------------------------------------
-- 5. ANTI-RECURSION SECURITY DEFINER HELPER FUNCTIONS (FOR RLS POLICIES)
-- ------------------------------------------------------------------------------

-- Check if current user is an active member of the workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

-- Get current user's role in the workspace
create or replace function public.get_workspace_role(ws_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.workspace_members
  where workspace_id = ws_id
    and user_id = auth.uid()
  limit 1;
$$;

-- Check if current user has one of the required roles in the workspace
create or replace function public.has_workspace_role(ws_id uuid, required_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role = any(required_roles)
  );
$$;

-- Check if current user can view a project (via workspace membership, visibility, or explicit project membership)
create or replace function public.can_access_project(proj_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = proj_id
      and (
        -- Explicit project member
        exists (select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid())
        or
        -- Workspace Owner or Admin always has project visibility
        public.has_workspace_role(p.workspace_id, array['Owner', 'Admin'])
        or
        -- Workspace-visible projects accessible to all workspace members
        (p.visibility = 'workspace' and public.is_workspace_member(p.workspace_id))
      )
  );
$$;

-- Check if current user can edit or manage a project
create or replace function public.can_modify_project(proj_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = proj_id
      and (
        public.has_workspace_role(p.workspace_id, array['Owner', 'Admin'])
        or
        exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = auth.uid()
            and pm.role = 'Lead'
        )
      )
  );
$$;

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all 16 application tables
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.attachments enable row level security;
alter table public.documents enable row level security;
alter table public.document_updates enable row level security;
alter table public.whiteboards enable row level security;
alter table public.whiteboard_elements enable row level security;
alter table public.activity_logs enable row level security;

-- 6.1 PROFILES POLICIES
drop policy if exists "Allow authenticated users to read profiles" on public.profiles;
create policy "Allow authenticated users to read profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Allow users to insert their own profile" on public.profiles;
create policy "Allow users to insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 6.2 WORKSPACES POLICIES
drop policy if exists "Members can view workspaces" on public.workspaces;
create policy "Members can view workspaces"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "Authenticated users can create workspaces" on public.workspaces;
create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Owners and Admins can update workspace" on public.workspaces;
create policy "Owners and Admins can update workspace"
  on public.workspaces for update
  to authenticated
  using (public.has_workspace_role(id, array['Owner', 'Admin']))
  with check (public.has_workspace_role(id, array['Owner', 'Admin']));

drop policy if exists "Only Owners can delete workspace" on public.workspaces;
create policy "Only Owners can delete workspace"
  on public.workspaces for delete
  to authenticated
  using (public.has_workspace_role(id, array['Owner']));

-- 6.3 WORKSPACE MEMBERS POLICIES
drop policy if exists "Members can view workspace member roster" on public.workspace_members;
create policy "Members can view workspace member roster"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Owners and Admins can add members" on public.workspace_members;
create policy "Owners and Admins can add members"
  on public.workspace_members for insert
  to authenticated
  with check (public.has_workspace_role(workspace_id, array['Owner', 'Admin']));

drop policy if exists "Owners and Admins can update member roles" on public.workspace_members;
create policy "Owners and Admins can update member roles"
  on public.workspace_members for update
  to authenticated
  using (public.has_workspace_role(workspace_id, array['Owner', 'Admin']))
  with check (public.has_workspace_role(workspace_id, array['Owner', 'Admin']));

drop policy if exists "Owners Admins or user can remove membership" on public.workspace_members;
create policy "Owners Admins or user can remove membership"
  on public.workspace_members for delete
  to authenticated
  using (
    public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
    or user_id = auth.uid()
  );

-- 6.4 INVITATIONS POLICIES
drop policy if exists "Workspace members and invitees can view invitation" on public.invitations;
create policy "Workspace members and invitees can view invitation"
  on public.invitations for select
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    or lower(email) = lower(auth.jwt()->>'email')
  );

drop policy if exists "Owners and Admins can create invitations" on public.invitations;
create policy "Owners and Admins can create invitations"
  on public.invitations for insert
  to authenticated
  with check (
    public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
    and auth.uid() = invited_by
  );

drop policy if exists "Owners Admins or invitee can update invitation" on public.invitations;
create policy "Owners Admins or invitee can update invitation"
  on public.invitations for update
  to authenticated
  using (
    public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
    or lower(email) = lower(auth.jwt()->>'email')
  )
  with check (
    public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
    or lower(email) = lower(auth.jwt()->>'email')
  );

drop policy if exists "Owners and Admins can delete invitations" on public.invitations;
create policy "Owners and Admins can delete invitations"
  on public.invitations for delete
  to authenticated
  using (public.has_workspace_role(workspace_id, array['Owner', 'Admin']));

-- 6.5 PROJECTS POLICIES
drop policy if exists "Members can view accessible projects" on public.projects;
create policy "Members can view accessible projects"
  on public.projects for select
  to authenticated
  using (public.can_access_project(id));

drop policy if exists "Workspace contributors can create projects" on public.projects;
create policy "Workspace contributors can create projects"
  on public.projects for insert
  to authenticated
  with check (
    public.has_workspace_role(workspace_id, array['Owner', 'Admin', 'Member'])
    and auth.uid() = created_by
  );

drop policy if exists "Leads and Workspace Admins can update project" on public.projects;
create policy "Leads and Workspace Admins can update project"
  on public.projects for update
  to authenticated
  using (public.can_modify_project(id))
  with check (public.can_modify_project(id));

drop policy if exists "Leads and Workspace Admins can delete project" on public.projects;
create policy "Leads and Workspace Admins can delete project"
  on public.projects for delete
  to authenticated
  using (public.can_modify_project(id));

-- 6.6 PROJECT MEMBERS POLICIES
drop policy if exists "Members can view project member list" on public.project_members;
create policy "Members can view project member list"
  on public.project_members for select
  to authenticated
  using (public.can_access_project(project_id));

drop policy if exists "Leads and Admins can add project members" on public.project_members;
create policy "Leads and Admins can add project members"
  on public.project_members for insert
  to authenticated
  with check (public.can_modify_project(project_id));

drop policy if exists "Leads and Admins can update project members" on public.project_members;
create policy "Leads and Admins can update project members"
  on public.project_members for update
  to authenticated
  using (public.can_modify_project(project_id))
  with check (public.can_modify_project(project_id));

drop policy if exists "Leads Admins or member can remove project membership" on public.project_members;
create policy "Leads Admins or member can remove project membership"
  on public.project_members for delete
  to authenticated
  using (
    public.can_modify_project(project_id)
    or user_id = auth.uid()
  );

-- 6.7 TASKS POLICIES
drop policy if exists "Members can view accessible tasks" on public.tasks;
create policy "Members can view accessible tasks"
  on public.tasks for select
  to authenticated
  using (public.can_access_project(project_id));

drop policy if exists "Workspace members can create tasks in accessible projects" on public.tasks;
create policy "Workspace members can create tasks in accessible projects"
  on public.tasks for insert
  to authenticated
  with check (
    public.can_access_project(project_id)
    and public.has_workspace_role(workspace_id, array['Owner', 'Admin', 'Member'])
    and auth.uid() = reporter_id
  );

drop policy if exists "Workspace members can update tasks in accessible projects" on public.tasks;
create policy "Workspace members can update tasks in accessible projects"
  on public.tasks for update
  to authenticated
  using (
    public.can_access_project(project_id)
    and public.has_workspace_role(workspace_id, array['Owner', 'Admin', 'Member'])
  )
  with check (
    public.can_access_project(project_id)
    and public.has_workspace_role(workspace_id, array['Owner', 'Admin', 'Member'])
  );

drop policy if exists "Reporters and Admins can delete tasks" on public.tasks;
create policy "Reporters and Admins can delete tasks"
  on public.tasks for delete
  to authenticated
  using (
    auth.uid() = reporter_id
    or public.can_modify_project(project_id)
  );

-- 6.8 TASK COMMENTS POLICIES
drop policy if exists "Members can view task comments" on public.task_comments;
create policy "Members can view task comments"
  on public.task_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.can_access_project(t.project_id)
    )
  );

drop policy if exists "Members can author task comments" on public.task_comments;
create policy "Members can author task comments"
  on public.task_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.can_access_project(t.project_id)
        and public.has_workspace_role(t.workspace_id, array['Owner', 'Admin', 'Member'])
    )
  );

drop policy if exists "Authors can update task comments" on public.task_comments;
create policy "Authors can update task comments"
  on public.task_comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Authors and Workspace Admins can delete comments" on public.task_comments;
create policy "Authors and Workspace Admins can delete comments"
  on public.task_comments for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.has_workspace_role(t.workspace_id, array['Owner', 'Admin'])
    )
  );

-- 6.9 MESSAGES POLICIES
drop policy if exists "Workspace members can view messages" on public.messages;
create policy "Workspace members can view messages"
  on public.messages for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can send messages" on public.messages;
create policy "Workspace members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and auth.uid() = sender_id
  );

drop policy if exists "Message authors can update message" on public.messages;
create policy "Message authors can update message"
  on public.messages for update
  to authenticated
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

drop policy if exists "Message authors or Admins can delete message" on public.messages;
create policy "Message authors or Admins can delete message"
  on public.messages for delete
  to authenticated
  using (
    auth.uid() = sender_id
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

-- 6.10 NOTIFICATIONS POLICIES
drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Workspace members can insert notifications" on public.notifications;
create policy "Workspace members can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (
    workspace_id is null
    or public.is_workspace_member(workspace_id)
  );

drop policy if exists "Users can update their notifications (mark as read)" on public.notifications;
create policy "Users can update their notifications (mark as read)"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their notifications" on public.notifications;
create policy "Users can delete their notifications"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6.11 DOCUMENTS POLICIES
drop policy if exists "Members can view accessible documents" on public.documents;
create policy "Members can view accessible documents"
  on public.documents for select
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists "Workspace members can create documents" on public.documents;
create policy "Workspace members can create documents"
  on public.documents for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and auth.uid() = created_by
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists "Workspace members can update accessible documents" on public.documents;
create policy "Workspace members can update accessible documents"
  on public.documents for update
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  )
  with check (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists "Authors and Admins can delete documents" on public.documents;
create policy "Authors and Admins can delete documents"
  on public.documents for delete
  to authenticated
  using (
    auth.uid() = created_by
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

-- 6.12 DOCUMENT UPDATES POLICIES
drop policy if exists "Members can view document update history" on public.document_updates;
create policy "Members can view document update history"
  on public.document_updates for select
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.is_workspace_member(d.workspace_id)
    )
  );

drop policy if exists "Members can record document updates" on public.document_updates;
create policy "Members can record document updates"
  on public.document_updates for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.is_workspace_member(d.workspace_id)
    )
  );

drop policy if exists "Admins can delete document history" on public.document_updates;
create policy "Admins can delete document history"
  on public.document_updates for delete
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.has_workspace_role(d.workspace_id, array['Owner', 'Admin'])
    )
  );

-- 6.13 WHITEBOARDS POLICIES
drop policy if exists "Members can view accessible whiteboards" on public.whiteboards;
create policy "Members can view accessible whiteboards"
  on public.whiteboards for select
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists "Workspace members can create whiteboards" on public.whiteboards;
create policy "Workspace members can create whiteboards"
  on public.whiteboards for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and auth.uid() = created_by
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists "Workspace members can update whiteboards" on public.whiteboards;
create policy "Workspace members can update whiteboards"
  on public.whiteboards for update
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  )
  with check (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists "Authors and Admins can delete whiteboards" on public.whiteboards;
create policy "Authors and Admins can delete whiteboards"
  on public.whiteboards for delete
  to authenticated
  using (
    auth.uid() = created_by
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

-- 6.14 WHITEBOARD ELEMENTS POLICIES
drop policy if exists "Members can view whiteboard canvas elements" on public.whiteboard_elements;
create policy "Members can view whiteboard canvas elements"
  on public.whiteboard_elements for select
  to authenticated
  using (
    exists (
      select 1 from public.whiteboards w
      where w.id = whiteboard_id
        and public.is_workspace_member(w.workspace_id)
    )
  );

drop policy if exists "Members can insert whiteboard elements" on public.whiteboard_elements;
create policy "Members can insert whiteboard elements"
  on public.whiteboard_elements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.whiteboards w
      where w.id = whiteboard_id
        and public.is_workspace_member(w.workspace_id)
    )
  );

drop policy if exists "Members can update whiteboard elements" on public.whiteboard_elements;
create policy "Members can update whiteboard elements"
  on public.whiteboard_elements for update
  to authenticated
  using (
    exists (
      select 1 from public.whiteboards w
      where w.id = whiteboard_id
        and public.is_workspace_member(w.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.whiteboards w
      where w.id = whiteboard_id
        and public.is_workspace_member(w.workspace_id)
    )
  );

drop policy if exists "Members can delete whiteboard elements" on public.whiteboard_elements;
create policy "Members can delete whiteboard elements"
  on public.whiteboard_elements for delete
  to authenticated
  using (
    exists (
      select 1 from public.whiteboards w
      where w.id = whiteboard_id
        and public.is_workspace_member(w.workspace_id)
    )
  );

-- 6.15 ATTACHMENTS POLICIES
drop policy if exists "Workspace members can view file attachments" on public.attachments;
create policy "Workspace members can view file attachments"
  on public.attachments for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert file attachments" on public.attachments;
create policy "Workspace members can insert file attachments"
  on public.attachments for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and auth.uid() = uploader_id
  );

drop policy if exists "Uploaders and Admins can update attachment metadata" on public.attachments;
create policy "Uploaders and Admins can update attachment metadata"
  on public.attachments for update
  to authenticated
  using (
    auth.uid() = uploader_id
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  )
  with check (
    auth.uid() = uploader_id
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

drop policy if exists "Uploaders and Admins can delete attachments" on public.attachments;
create policy "Uploaders and Admins can delete attachments"
  on public.attachments for delete
  to authenticated
  using (
    auth.uid() = uploader_id
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

-- 6.16 ACTIVITY LOGS POLICIES
drop policy if exists "Workspace members can view activity logs" on public.activity_logs;
create policy "Workspace members can view activity logs"
  on public.activity_logs for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can append activity logs" on public.activity_logs;
create policy "Workspace members can append activity logs"
  on public.activity_logs for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

-- Activity logs are immutable: NO update policy allowed!

drop policy if exists "Only Workspace Owners can prune activity logs" on public.activity_logs;
create policy "Only Workspace Owners can prune activity logs"
  on public.activity_logs for delete
  to authenticated
  using (public.has_workspace_role(workspace_id, array['Owner']));


-- ==============================================================================
-- CollabSpace Migration: Project-Specific Real-Time Chat & Attachments
-- Migration: 20240110000000_project_realtime_chat.sql
-- Description:
--   1. Adds project_id to public.messages with foreign key and cascade.
--   2. Adds performance indexes for project-level chat and timestamps.
--   3. Updates RLS policies so only project members can view and send messages.
--   4. Creates storage bucket 'chat-attachments' for rich file sharing.
--   5. Enables Supabase Realtime replication on public.messages.
-- ==============================================================================

-- 1. Ensure project_id column exists on public.messages
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'project_id'
  ) then
    alter table public.messages
      add column project_id uuid references public.projects(id) on delete cascade;
  end if;
end $$;

-- 2. Indexes for project-specific real-time chat
create index if not exists idx_messages_proj_created
  on public.messages (project_id, created_at asc);

create index if not exists idx_messages_ws_proj
  on public.messages (workspace_id, project_id);

create index if not exists idx_messages_parent_reply
  on public.messages (parent_id) where parent_id is not null;

-- 3. Row Level Security Policies for public.messages

-- 3.1 SELECT: Only authorized workspace and project members can read messages
drop policy if exists "Workspace members can view messages" on public.messages;
drop policy if exists "Project members can view messages" on public.messages;

create policy "Project members can view messages"
  on public.messages for select
  to authenticated
  using (
    (project_id is null and public.is_workspace_member(workspace_id))
    or
    (project_id is not null and public.can_access_project(project_id))
  );

-- 3.2 INSERT: Only authorized workspace and project members can send messages
drop policy if exists "Workspace members can send messages" on public.messages;
drop policy if exists "Authorized members can send messages" on public.messages;

create policy "Authorized members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and (
      (project_id is null and public.is_workspace_member(workspace_id))
      or
      (project_id is not null and public.can_access_project(project_id))
    )
  );

-- 3.3 UPDATE: Strictly message authors only (prevents unauthorized tampering)
drop policy if exists "Message authors can update message" on public.messages;

create policy "Message authors can update message"
  on public.messages for update
  to authenticated
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

-- 3.4 DELETE: Message authors or Workspace Admins or Project Leads can delete messages
drop policy if exists "Message authors or Admins can delete message" on public.messages;

create policy "Message authors or Admins can delete message"
  on public.messages for delete
  to authenticated
  using (
    auth.uid() = sender_id
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
    or (project_id is not null and exists (
      select 1 from public.project_members pm
      where pm.project_id = messages.project_id
        and pm.user_id = auth.uid()
        and pm.role = 'Lead'
    ))
  );

-- 4. Enable Supabase Realtime publication on public.messages
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
exception
  when others then
    -- Publication might not exist in restricted environments; fail gracefully
    null;
end $$;

-- 5. Storage Bucket for Chat Attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760, -- 10 MB per attachment
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'text/plain',
    'application/json'
  ]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'text/plain',
    'application/json'
  ];

-- 5.1 Storage RLS: Public read access for chat attachments
drop policy if exists "Chat attachments are readable" on storage.objects;
create policy "Chat attachments are readable"
  on storage.objects for select
  using (bucket_id = 'chat-attachments');

-- 5.2 Storage RLS: Authenticated users can upload attachments
drop policy if exists "Authenticated users can upload chat attachments" on storage.objects;
create policy "Authenticated users can upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-attachments');

-- 5.3 Storage RLS: Uploaders can delete their attachments
drop policy if exists "Uploaders can delete their chat attachments" on storage.objects;
create policy "Uploaders can delete their chat attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'chat-attachments' and auth.uid()::text = (storage.foldername(name))[1]);


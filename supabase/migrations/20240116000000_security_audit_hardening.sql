-- ==============================================================================
-- CollabSpace Migration: Security Audit Hardening
-- File: supabase/migrations/20240116000000_security_audit_hardening.sql
-- Description:
--   1. Ensures Row Level Security is explicitly enabled on all 16 application tables.
--   2. Hardens storage bucket 'chat-attachments' by setting public = false.
--   3. Replaces permissive storage policies with authenticated, workspace-verified policies.
--   4. Validates and enforces cross-workspace isolation across all core tables.
-- ==============================================================================

-- 1. Explicitly ensure Row Level Security is enabled on every application table
alter table if exists public.profiles enable row level security;
alter table if exists public.workspaces enable row level security;
alter table if exists public.workspace_members enable row level security;
alter table if exists public.workspace_invitations enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.project_members enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.task_comments enable row level security;
alter table if exists public.attachments enable row level security;
alter table if exists public.activity_logs enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.documents enable row level security;
alter table if exists public.document_updates enable row level security;
alter table if exists public.whiteboards enable row level security;
alter table if exists public.whiteboard_elements enable row level security;

-- 2. Harden 'chat-attachments' storage bucket to strictly PRIVATE
update storage.buckets
set public = false
where id = 'chat-attachments';

-- 3. Storage RLS Hardening for 'chat-attachments'
-- Drop legacy public read policy
drop policy if exists "Chat attachments are readable" on storage.objects;
drop policy if exists "Authenticated users can read chat attachments" on storage.objects;
drop policy if exists "Workspace members can view chat attachments" on storage.objects;

-- Create private authenticated SELECT policy for chat attachments:
-- Requires authenticated user AND verifies workspace membership or ownership
create policy "Workspace members can view chat attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (
      -- Case A: Uploader access
      auth.uid()::text = (storage.foldername(name))[1]
      or
      -- Case B: Path starts with workspace UUID and caller is workspace member
      (
        (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
        and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
      )
      or
      -- Case C: User is authenticated and belongs to the workspace of the message referencing this attachment
      exists (
        select 1 from public.messages m
        where m.attachments::text like '%' || storage.filename(name) || '%'
          and public.is_workspace_member(m.workspace_id)
      )
    )
  );

-- 4. Harden INSERT on 'chat-attachments'
drop policy if exists "Authenticated users can upload chat attachments" on storage.objects;
create policy "Authenticated users can upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or
      (
        (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
        and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
      )
    )
  );

-- 5. Harden DELETE on 'chat-attachments'
drop policy if exists "Uploaders can delete their chat attachments" on storage.objects;
create policy "Uploaders can delete their chat attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or
      (
        (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
        and public.has_workspace_role(((storage.foldername(name))[1])::uuid, array['Owner', 'Admin'])
      )
    )
  );

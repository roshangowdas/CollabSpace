-- ==============================================================================
-- CollabSpace Migration: Collaborative Documents & Yjs Synchronization
-- File: supabase/migrations/20240113000000_collaborative_documents.sql
-- Description:
--   1. Ensures yjs_state column exists on public.documents for CRDT persistence.
--   2. Adds performance indexes for workspace document browsing.
--   3. Refines RLS policies on public.documents and public.document_updates.
-- ==============================================================================

-- 1. Add yjs_state column to public.documents for binary/base64 Yjs CRDT state
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'yjs_state'
  ) then
    alter table public.documents
      add column yjs_state text default null;
  end if;
end $$;

-- 2. Indexes for document lookup & sorting
create index if not exists idx_documents_workspace_updated
  on public.documents (workspace_id, updated_at desc);

create index if not exists idx_documents_workspace_archived
  on public.documents (workspace_id, is_archived)
  where is_archived = false;

-- 3. Document RLS Policies Verification & Refinement
alter table public.documents enable row level security;
alter table public.document_updates enable row level security;

-- 3.1 SELECT: Workspace members can view accessible documents
drop policy if exists "Members can view accessible documents" on public.documents;
create policy "Members can view accessible documents"
  on public.documents for select
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  );

-- 3.2 INSERT: Workspace members can create documents
drop policy if exists "Workspace members can create documents" on public.documents;
create policy "Workspace members can create documents"
  on public.documents for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and auth.uid() = created_by
    and (project_id is null or public.can_access_project(project_id))
  );

-- 3.3 UPDATE: Workspace members can update accessible documents (live collaboration)
drop policy if exists "Workspace members can update accessible documents" on public.documents;
create policy "Workspace members can update accessible documents"
  on public.documents for update
  to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (project_id is null or public.can_access_project(project_id))
  );

-- 3.4 DELETE: Creators and Workspace Admins can delete documents
drop policy if exists "Creators and Admins can delete documents" on public.documents;
create policy "Creators and Admins can delete documents"
  on public.documents for delete
  to authenticated
  using (
    auth.uid() = created_by
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

-- 3.5 Document Updates RLS: Workspace members can record & view version history
drop policy if exists "Workspace members can view document updates" on public.document_updates;
create policy "Workspace members can view document updates"
  on public.document_updates for select
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.is_workspace_member(d.workspace_id)
    )
  );

drop policy if exists "Workspace members can insert document updates" on public.document_updates;
create policy "Workspace members can insert document updates"
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

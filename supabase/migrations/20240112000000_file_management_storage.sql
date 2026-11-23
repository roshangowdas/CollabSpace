-- ==============================================================================
-- CollabSpace Migration: File Management & Private Storage Bucket
-- File: supabase/migrations/20240112000000_file_management_storage.sql
-- Description:
--   1. Ensures project_id column exists on public.attachments table.
--   2. Provisions private storage bucket 'workspace-files' (public = false).
--   3. Sets up RLS policies on storage.objects for workspace-level isolation.
--   4. Refines RLS policies on public.attachments for authenticated access.
-- ==============================================================================

-- 1. Ensure project_id column exists on public.attachments
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attachments'
      and column_name = 'project_id'
  ) then
    alter table public.attachments 
      add column project_id uuid references public.projects(id) on delete cascade;
  end if;
end $$;

-- Indexes for attachments lookup
create index if not exists idx_attachments_project
  on public.attachments (project_id)
  where project_id is not null;

create index if not exists idx_attachments_workspace_created
  on public.attachments (workspace_id, created_at desc);

create index if not exists idx_attachments_uploader
  on public.attachments (uploader_id);

-- 2. Create Private Storage Bucket for Workspace Files
-- Must be private (public = false) so signed URLs or authenticated requests are required
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-files',
  'workspace-files',
  false, -- Strictly PRIVATE storage
  52428800, -- 50 MB file size limit
  null -- Allows images, PDFs, office documents, text, code, and zip archives
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800;

-- 3. Storage RLS Policies for 'workspace-files' bucket
-- Storage objects path convention: <workspace_id>/<category_or_project_id>/<unique_file_name>
-- (storage.foldername(name))[1] resolves to the workspace_id UUID

-- 3.1 SELECT: Workspace members can view and download private files
drop policy if exists "Workspace members can view workspace files" on storage.objects;
create policy "Workspace members can view workspace files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (
      -- Extract workspace UUID from first folder segment
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
    )
  );

-- 3.2 INSERT: Workspace members can upload files to their workspace
drop policy if exists "Workspace members can upload workspace files" on storage.objects;
create policy "Workspace members can upload workspace files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-files'
    and (
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
    )
  );

-- 3.3 UPDATE: Uploaders and Workspace Admins can update files
drop policy if exists "Uploaders and Admins can update workspace files" on storage.objects;
create policy "Uploaders and Admins can update workspace files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      and (
        auth.uid() = owner
        or public.has_workspace_role(((storage.foldername(name))[1])::uuid, array['Owner', 'Admin'])
      )
    )
  );

-- 3.4 DELETE: Uploaders and Workspace Admins can delete files
drop policy if exists "Uploaders and Admins can delete workspace files" on storage.objects;
create policy "Uploaders and Admins can delete workspace files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      and (
        auth.uid() = owner
        or public.has_workspace_role(((storage.foldername(name))[1])::uuid, array['Owner', 'Admin'])
      )
    )
  );

-- 4. Refine public.attachments RLS Policies
alter table public.attachments enable row level security;

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
  );

drop policy if exists "Uploaders and Admins can delete attachments" on public.attachments;
create policy "Uploaders and Admins can delete attachments"
  on public.attachments for delete
  to authenticated
  using (
    auth.uid() = uploader_id
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

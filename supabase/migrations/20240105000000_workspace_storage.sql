-- CollabSpace Migration: Workspace Logos Storage Bucket & Policies
-- File: supabase/migrations/20240105000000_workspace_storage.sql

-- 1. Create storage bucket for workspace logos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- 2. Storage RLS Policies for workspace-logos

-- Anyone can view workspace logos
drop policy if exists "Workspace logos are publicly accessible" on storage.objects;
create policy "Workspace logos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'workspace-logos');

-- Authenticated users can upload workspace logos for workspaces they manage
drop policy if exists "Owners and Admins can upload workspace logos" on storage.objects;
create policy "Owners and Admins can upload workspace logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-logos'
  );

-- Authenticated users can update workspace logos
drop policy if exists "Owners and Admins can update workspace logos" on storage.objects;
create policy "Owners and Admins can update workspace logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-logos'
  );

-- Authenticated users can delete workspace logos
drop policy if exists "Owners and Admins can delete workspace logos" on storage.objects;
create policy "Owners and Admins can delete workspace logos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workspace-logos'
  );


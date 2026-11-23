-- ==============================================================================
-- CollabSpace Migration: Collaborative Whiteboard Enhancements
-- File: supabase/migrations/20240114000000_collaborative_whiteboard.sql
-- Description:
--   1. Adds viewport and canvas_state metadata to public.whiteboards.
--   2. Ensures indexes on public.whiteboard_elements for fast element hydration.
--   3. Refines RLS policies on whiteboards and whiteboard_elements.
-- ==============================================================================

-- 1. Ensure canvas_state column exists on public.whiteboards
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'whiteboards'
      and column_name = 'canvas_state'
  ) then
    alter table public.whiteboards
      add column canvas_state jsonb default '{"viewport":{"x":0,"y":0,"zoom":1}}'::jsonb;
  end if;
end $$;

-- 2. Performance indexes
create index if not exists idx_whiteboards_workspace_updated
  on public.whiteboards (workspace_id, updated_at desc);

create index if not exists idx_whiteboard_elements_lookup
  on public.whiteboard_elements (whiteboard_id, z_index asc);

-- 3. Refine RLS Policies
alter table public.whiteboards enable row level security;
alter table public.whiteboard_elements enable row level security;

-- 3.1 Whiteboard SELECT & Modification
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
  );

drop policy if exists "Creators and Admins can delete whiteboards" on public.whiteboards;
create policy "Creators and Admins can delete whiteboards"
  on public.whiteboards for delete
  to authenticated
  using (
    auth.uid() = created_by
    or public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
  );

-- 3.2 Whiteboard Elements CRUD
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

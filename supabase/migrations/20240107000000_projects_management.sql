-- ==============================================================================
-- CollabSpace Migration: Project Management & Member Assignments
-- Migration: 20240107000000_projects_management.sql
-- Description: Adds start_date and due_date to projects, adds project progress
--              helpers, ensures triggers and indexes for project lifecycles.
-- ==============================================================================

-- 1. Ensure start_date and due_date columns exist on public.projects
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'start_date'
  ) then
    alter table public.projects add column start_date timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'due_date'
  ) then
    alter table public.projects add column due_date timestamptz;
  end if;
end $$;

-- 2. Add date range check constraint
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'projects'
      and constraint_name = 'projects_date_range_check'
  ) then
    alter table public.projects
      add constraint projects_date_range_check
      check (due_date is null or start_date is null or due_date >= start_date);
  end if;
end $$;

-- 3. Indexes for project search and filtering
create index if not exists idx_projects_ws_status
  on public.projects (workspace_id, status);
create index if not exists idx_projects_ws_due_date
  on public.projects (workspace_id, due_date);
create index if not exists idx_projects_name_search
  on public.projects (workspace_id, name);

-- 4. Trigger to ensure creator is automatically assigned 'Lead' role in project_members
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


-- ==============================================================================
-- CollabSpace Migration: Task Management & Assignee Project Membership Validation
-- Migration: 20240108000000_task_management.sql
-- Description: Supports 'completed' status, adds indexes for tasks queries,
--              and enforces project membership validation for assignees.
-- ==============================================================================

-- 1. Ensure status check supports 'completed' alongside standard statuses
do $$
begin
  alter table public.tasks drop constraint if exists tasks_status_check;
  alter table public.tasks add constraint tasks_status_check
    check (status in ('todo', 'in_progress', 'in_review', 'completed', 'done', 'backlog', 'canceled'));
exception
  when others then null;
end $$;

-- 2. Indexes for assignee filtering, status, priority, and due dates
create index if not exists idx_tasks_assignee on public.tasks (assignee_id);
create index if not exists idx_tasks_reporter on public.tasks (reporter_id);
create index if not exists idx_tasks_workspace_status on public.tasks (workspace_id, status);
create index if not exists idx_tasks_workspace_priority on public.tasks (workspace_id, priority);
create index if not exists idx_tasks_workspace_due_date on public.tasks (workspace_id, due_date);

-- 3. Function to validate that a task assignee is an assigned member of the project
create or replace function public.validate_task_assignee_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null then
    -- Verify assignee is present in public.project_members for new.project_id
    if not exists (
      select 1 from public.project_members
      where project_id = new.project_id and user_id = new.assignee_id
    ) then
      raise exception 'Assignee % must be an assigned member of project % before receiving tasks', new.assignee_id, new.project_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_task_assignee_validate on public.tasks;
create trigger on_task_assignee_validate
  before insert or update on public.tasks
  for each row execute procedure public.validate_task_assignee_membership();


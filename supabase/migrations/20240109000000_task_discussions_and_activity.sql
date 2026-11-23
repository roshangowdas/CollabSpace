-- ==============================================================================
-- CollabSpace Migration: Task Discussions & Automated Activity History Triggers
-- Migration: 20240109000000_task_discussions_and_activity.sql
-- Description: Indexes for fast activity timeline lookups and automated audit triggers
--              for task status changes, assignments, due dates, and comments.
-- ==============================================================================

-- 1. Index activity_logs for rapid task timeline retrieval
create index if not exists idx_activity_logs_entity
  on public.activity_logs (entity_type, entity_id, created_at desc);

create index if not exists idx_activity_logs_workspace_entity
  on public.activity_logs (workspace_id, entity_id);

-- 2. Trigger function to capture task updates into activity_logs
create or replace function public.log_task_lifecycle_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
begin
  -- If auth.uid() is null (e.g. system or background), fallback to reporter or assignee
  if actor_id is null then
    actor_id := coalesce(new.reporter_id, new.assignee_id);
  end if;

  -- 2.1 Track Status Changes
  if old.status is distinct from new.status then
    insert into public.activity_logs (
      workspace_id,
      user_id,
      action,
      entity_type,
      entity_id,
      entity_title,
      details
    ) values (
      new.workspace_id,
      actor_id,
      'status_changed',
      'task',
      new.id,
      new.title,
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status
      )
    );
  end if;

  -- 2.2 Track Assignment Changes
  if old.assignee_id is distinct from new.assignee_id then
    insert into public.activity_logs (
      workspace_id,
      user_id,
      action,
      entity_type,
      entity_id,
      entity_title,
      details
    ) values (
      new.workspace_id,
      actor_id,
      'assigned',
      'task',
      new.id,
      new.title,
      jsonb_build_object(
        'old_assignee_id', old.assignee_id,
        'new_assignee_id', new.assignee_id
      )
    );
  end if;

  -- 2.3 Track Due Date Changes
  if old.due_date is distinct from new.due_date then
    insert into public.activity_logs (
      workspace_id,
      user_id,
      action,
      entity_type,
      entity_id,
      entity_title,
      details
    ) values (
      new.workspace_id,
      actor_id,
      'updated',
      'task',
      new.id,
      new.title,
      jsonb_build_object(
        'field', 'due_date',
        'old_due_date', old.due_date,
        'new_due_date', new.due_date
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_task_activity_audit on public.tasks;
create trigger on_task_activity_audit
  after update on public.tasks
  for each row execute procedure public.log_task_lifecycle_activity();

-- 3. Trigger function to capture new task comments into activity_logs
create or replace function public.log_task_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_rec record;
begin
  select workspace_id, title into task_rec
  from public.tasks
  where id = new.task_id;

  if found then
    insert into public.activity_logs (
      workspace_id,
      user_id,
      action,
      entity_type,
      entity_id,
      entity_title,
      details
    ) values (
      task_rec.workspace_id,
      new.user_id,
      'commented',
      'task',
      new.task_id,
      task_rec.title,
      jsonb_build_object(
        'comment_id', new.id,
        'snippet', substring(new.content from 1 for 100)
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_task_comment_audit on public.task_comments;
create trigger on_task_comment_audit
  after insert on public.task_comments
  for each row execute procedure public.log_task_comment_activity();


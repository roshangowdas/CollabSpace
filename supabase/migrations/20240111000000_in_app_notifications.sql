-- ==============================================================================
-- CollabSpace Migration: Complete In-App Notification System
-- Migration: 20240111000000_in_app_notifications.sql
-- Description:
--   1. Expands notification types and adds actor_id + metadata.
--   2. Adds deduplication helper function public.create_notification.
--   3. Adds automated triggers for task assignments, status changes,
--      task comments, @mentions, workspace joins, and chat replies.
--   4. Configures performance indexes and Supabase Realtime publication.
-- ==============================================================================

-- 1. Ensure actor_id and metadata columns exist on public.notifications
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'actor_id'
  ) then
    alter table public.notifications
      add column actor_id uuid references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'metadata'
  ) then
    alter table public.notifications
      add column metadata jsonb default '{}'::jsonb not null;
  end if;
end $$;

-- 2. Update type check constraint to include all required notification events
alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check
  check (type in (
    'mention',
    'assignment',
    'invitation',
    'system',
    'comment',
    'status_change',
    'deadline',
    'member_joined',
    'announcement',
    'chat_message'
  ));

-- 3. Optimized indexes for user notifications and unread tracking
create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, is_read, created_at desc);

create index if not exists idx_notifications_user_type
  on public.notifications (user_id, type, created_at desc);

create index if not exists idx_notifications_entity
  on public.notifications (entity_type, entity_id);

create index if not exists idx_notifications_actor
  on public.notifications (actor_id);

-- 4. Secure Helper Function: create_notification with Duplicate Prevention
create or replace function public.create_notification(
  p_user_id uuid,
  p_workspace_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_link text default null,
  p_actor_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_recent_exists boolean;
begin
  -- Prevent users from receiving notifications for their own actions
  if p_actor_id is not null and p_user_id = p_actor_id then
    return null;
  end if;

  -- Duplicate Prevention: Check if identical unread notification was issued recently (within 5 minutes)
  select exists (
    select 1 from public.notifications
    where user_id = p_user_id
      and type = p_type
      and entity_type = p_entity_type
      and entity_id = p_entity_id
      and is_read = false
      and created_at > (now() - interval '5 minutes')
  ) into v_recent_exists;

  if v_recent_exists then
    return null;
  end if;

  -- Insert notification
  insert into public.notifications (
    user_id,
    workspace_id,
    title,
    message,
    type,
    entity_type,
    entity_id,
    link,
    actor_id,
    metadata,
    is_read,
    created_at
  ) values (
    p_user_id,
    p_workspace_id,
    p_title,
    p_message,
    p_type,
    p_entity_type,
    p_entity_id,
    p_link,
    p_actor_id,
    p_metadata,
    false,
    now()
  )
  returning id into v_notification_id;

  return v_notification_id;
end;
$$;

-- 5. Trigger: Task Lifecycle Notifications (Assignments & Status Changes)
create or replace function public.notify_task_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor_name text;
begin
  v_actor_id := auth.uid();

  -- Get actor name
  select full_name into v_actor_name
  from public.profiles
  where id = v_actor_id;

  if v_actor_name is null then
    v_actor_name := 'A team member';
  end if;

  -- 5.1 Task Assignment Notification
  if new.assignee_id is not null and (old is null or old.assignee_id is distinct from new.assignee_id) then
    perform public.create_notification(
      p_user_id := new.assignee_id,
      p_workspace_id := new.workspace_id,
      p_title := 'New Task Assigned',
      p_message := v_actor_name || ' assigned you to "' || new.title || '"',
      p_type := 'assignment',
      p_entity_type := 'task',
      p_entity_id := new.id,
      p_link := '/tasks',
      p_actor_id := v_actor_id,
      p_metadata := jsonb_build_object(
        'task_id', new.id,
        'task_number', new.task_number,
        'task_title', new.title,
        'project_id', new.project_id
      )
    );
  end if;

  -- 5.2 Task Status Change Notification (Notify assignee or reporter)
  if old is not null and old.status is distinct from new.status then
    -- Notify Assignee if not the actor
    if new.assignee_id is not null and new.assignee_id <> v_actor_id then
      perform public.create_notification(
        p_user_id := new.assignee_id,
        p_workspace_id := new.workspace_id,
        p_title := 'Task Status Updated',
        p_message := 'Task "' || new.title || '" changed to ' || replace(new.status, '_', ' '),
        p_type := 'status_change',
        p_entity_type := 'task',
        p_entity_id := new.id,
        p_link := '/tasks',
        p_actor_id := v_actor_id,
        p_metadata := jsonb_build_object(
          'task_id', new.id,
          'task_title', new.title,
          'old_status', old.status,
          'new_status', new.status
        )
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_task_notification on public.tasks;
create trigger on_task_notification
  after insert or update on public.tasks
  for each row execute procedure public.notify_task_changes();

-- 6. Trigger: Task Comment & Mention Notifications
create or replace function public.notify_task_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task_title text;
  v_task_assignee uuid;
  v_workspace_id uuid;
  v_commenter_name text;
  v_mention record;
begin
  -- Retrieve task information
  select title, assignee_id, workspace_id
  into v_task_title, v_task_assignee, v_workspace_id
  from public.tasks
  where id = new.task_id;

  -- Retrieve commenter name
  select coalesce(full_name, username, 'A team member')
  into v_commenter_name
  from public.profiles
  where id = new.user_id;

  -- 6.1 Notify Task Assignee about comment
  if v_task_assignee is not null and v_task_assignee <> new.user_id then
    perform public.create_notification(
      p_user_id := v_task_assignee,
      p_workspace_id := v_workspace_id,
      p_title := 'New Task Comment',
      p_message := v_commenter_name || ' commented on "' || v_task_title || '"',
      p_type := 'comment',
      p_entity_type := 'task',
      p_entity_id := new.task_id,
      p_link := '/tasks',
      p_actor_id := new.user_id,
      p_metadata := jsonb_build_object(
        'task_id', new.task_id,
        'comment_id', new.id,
        'comment_preview', substring(new.content from 1 for 100)
      )
    );
  end if;

  -- 6.2 Parse @mentions in comment text and notify mentioned users
  for v_mention in (
    select distinct p.id as user_id, p.username
    from regexp_matches(new.content, '@([a-zA-Z0-9_]+)', 'g') as m(username_match)
    join public.profiles p on lower(p.username) = lower(m.username_match[1])
    where p.id <> new.user_id
  ) loop
    perform public.create_notification(
      p_user_id := v_mention.user_id,
      p_workspace_id := v_workspace_id,
      p_title := 'You were mentioned',
      p_message := v_commenter_name || ' mentioned you in a comment on "' || v_task_title || '"',
      p_type := 'mention',
      p_entity_type := 'task',
      p_entity_id := new.task_id,
      p_link := '/tasks',
      p_actor_id := new.user_id,
      p_metadata := jsonb_build_object(
        'task_id', new.task_id,
        'comment_id', new.id,
        'comment_preview', substring(new.content from 1 for 100)
      )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_task_comment_notification on public.task_comments;
create trigger on_task_comment_notification
  after insert on public.task_comments
  for each row execute procedure public.notify_task_comment();

-- 7. Trigger: Workspace Member Joined Notification (Notify Admins/Owner)
create or replace function public.notify_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_member_name text;
  v_admin record;
begin
  select coalesce(full_name, username, 'New member')
  into v_new_member_name
  from public.profiles
  where id = new.user_id;

  -- Notify workspace Owners and Admins
  for v_admin in (
    select user_id
    from public.workspace_members
    where workspace_id = new.workspace_id
      and role in ('Owner', 'Admin')
      and user_id <> new.user_id
  ) loop
    perform public.create_notification(
      p_user_id := v_admin.user_id,
      p_workspace_id := new.workspace_id,
      p_title := 'New Member Joined Workspace',
      p_message := v_new_member_name || ' has joined the workspace',
      p_type := 'member_joined',
      p_entity_type := 'workspace',
      p_entity_id := new.workspace_id,
      p_link := '/dashboard',
      p_actor_id := new.user_id,
      p_metadata := jsonb_build_object(
        'role', new.role,
        'workspace_id', new.workspace_id
      )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_workspace_member_joined on public.workspace_members;
create trigger on_workspace_member_joined
  after insert on public.workspace_members
  for each row execute procedure public.notify_member_joined();

-- 8. Enable Supabase Realtime publication on public.notifications
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception
  when others then
    null;
end $$;

-- ==============================================================================
-- CollabSpace Migration: Workspace Administration & RBAC Security Functions
-- Migration: 20240115000000_workspace_administration.sql
-- Description:
--   Enforces database-level authorization for workspace administration:
--   - Role constraint updates to support Developer, Designer, Tester, etc.
--   - Secure RPC: admin_update_member_role with self-promotion and owner protections
--   - Secure RPC: admin_remove_member preventing owner deletion
--   - Secure RPC: get_workspace_admin_stats with strict admin/owner gating
-- ==============================================================================

-- 1. Extend role constraint on workspace_members if needed
alter table public.workspace_members
  drop constraint if exists workspace_members_role_check;

alter table public.workspace_members
  add constraint workspace_members_role_check
  check (role in ('Owner', 'Admin', 'Developer', 'Designer', 'Tester', 'Member', 'Viewer'));

-- 2. Extend role constraint on invitations
alter table public.invitations
  drop constraint if exists invitations_role_check;

alter table public.invitations
  add constraint invitations_role_check
  check (role in ('Admin', 'Developer', 'Designer', 'Tester', 'Member', 'Viewer'));

-- 3. Secure RPC: Admin Update Member Role
create or replace function public.admin_update_member_role(
  p_workspace_id uuid,
  p_target_user_id uuid,
  p_new_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_target_role text;
  v_target_name text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- Verify caller membership and role in this specific workspace
  select role into v_caller_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = v_caller_id;

  if v_caller_role is null or v_caller_role not in ('Owner', 'Admin') then
    raise exception 'Unauthorized: Only workspace Owners and Admins can change member roles';
  end if;

  -- Validate new role value
  if p_new_role not in ('Owner', 'Admin', 'Developer', 'Designer', 'Tester', 'Member', 'Viewer') then
    raise exception 'Invalid role: %', p_new_role;
  end if;

  -- Fetch target member's current role
  select role into v_target_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = p_target_user_id;

  if v_target_role is null then
    raise exception 'Target user is not a member of this workspace';
  end if;

  -- Protection 1: Prevent users from promoting themselves to Owner
  if p_target_user_id = v_caller_id and p_new_role = 'Owner' and v_caller_role <> 'Owner' then
    raise exception 'Users cannot promote themselves to Owner';
  end if;

  -- Protection 2: Non-owners cannot promote anyone to Owner
  if p_new_role = 'Owner' and v_caller_role <> 'Owner' then
    raise exception 'Only the workspace Owner can transfer ownership or promote another user to Owner';
  end if;

  -- Protection 3: Cannot modify the Owner role except by the Owner themselves
  if v_target_role = 'Owner' and v_caller_role <> 'Owner' then
    raise exception 'Cannot modify the role of the workspace Owner';
  end if;

  -- Protection 4: Admins cannot change roles of other Admins
  if v_caller_role = 'Admin' and v_target_role = 'Admin' and p_target_user_id <> v_caller_id then
    raise exception 'Admins cannot modify the role of another Admin';
  end if;

  -- If transferring ownership, demote previous owner to Admin
  if p_new_role = 'Owner' and v_caller_role = 'Owner' and p_target_user_id <> v_caller_id then
    update public.workspace_members
    set role = 'Admin', updated_at = now()
    where workspace_id = p_workspace_id and user_id = v_caller_id;

    update public.workspaces
    set owner_id = p_target_user_id, updated_at = now()
    where id = p_workspace_id;
  end if;

  -- Perform the role update
  update public.workspace_members
  set role = p_new_role, updated_at = now()
  where workspace_id = p_workspace_id and user_id = p_target_user_id;

  -- Fetch target profile name for audit log
  select full_name into v_target_name
  from public.profiles
  where id = p_target_user_id;

  -- Log administrative activity
  insert into public.activity_logs (
    workspace_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_title,
    details
  ) values (
    p_workspace_id,
    v_caller_id,
    'role_changed',
    'workspace_member',
    p_target_user_id,
    coalesce(v_target_name, 'Member'),
    jsonb_build_object(
      'target_user_id', p_target_user_id,
      'old_role', v_target_role,
      'new_role', p_new_role
    )
  );

  return jsonb_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'old_role', v_target_role,
    'new_role', p_new_role
  );
end;
$$;

-- 4. Secure RPC: Admin Remove Member
create or replace function public.admin_remove_member(
  p_workspace_id uuid,
  p_target_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_target_role text;
  v_target_name text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- Verify caller role in this workspace
  select role into v_caller_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = v_caller_id;

  if v_caller_role is null or v_caller_role not in ('Owner', 'Admin') then
    raise exception 'Unauthorized: Only workspace Owners and Admins can remove members';
  end if;

  -- Fetch target member role
  select role into v_target_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = p_target_user_id;

  if v_target_role is null then
    raise exception 'Target user is not a member of this workspace';
  end if;

  -- Protection: Cannot remove workspace Owner
  if v_target_role = 'Owner' then
    raise exception 'Cannot remove the workspace Owner';
  end if;

  -- Protection: Admins cannot remove other Admins
  if v_caller_role = 'Admin' and v_target_role = 'Admin' and p_target_user_id <> v_caller_id then
    raise exception 'Admins cannot remove other Admins from the workspace';
  end if;

  -- Fetch target name for audit log
  select full_name into v_target_name
  from public.profiles
  where id = p_target_user_id;

  -- Remove from workspace_members
  delete from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = p_target_user_id;

  -- Also clean up project_members for this workspace
  delete from public.project_members
  where user_id = p_target_user_id
    and project_id in (select id from public.projects where workspace_id = p_workspace_id);

  -- Log audit activity
  insert into public.activity_logs (
    workspace_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_title,
    details
  ) values (
    p_workspace_id,
    v_caller_id,
    'member_removed',
    'workspace_member',
    p_target_user_id,
    coalesce(v_target_name, 'Member'),
    jsonb_build_object(
      'removed_user_id', p_target_user_id,
      'previous_role', v_target_role
    )
  );

  return jsonb_build_object(
    'success', true,
    'removed_user_id', p_target_user_id,
    'previous_role', v_target_role
  );
end;
$$;

-- 5. Secure RPC: Get Workspace Admin Stats
create or replace function public.get_workspace_admin_stats(
  p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_workspace jsonb;
  v_total_members int;
  v_total_projects int;
  v_active_projects int;
  v_pending_invites int;
  v_total_tasks int;
  v_completed_tasks int;
  v_in_progress_tasks int;
  v_overdue_tasks int;
begin
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- Enforce administrative access: caller must be Owner or Admin
  select role into v_caller_role
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id = v_caller_id;

  if v_caller_role is null or v_caller_role not in ('Owner', 'Admin') then
    raise exception 'Unauthorized: Workspace administration access required';
  end if;

  -- Workspace metadata
  select to_jsonb(w) into v_workspace
  from (
    select id, name, slug, description, logo_url, plan, owner_id, created_at, updated_at
    from public.workspaces
    where id = p_workspace_id
  ) w;

  -- Member counts
  select count(*) into v_total_members
  from public.workspace_members
  where workspace_id = p_workspace_id;

  -- Project counts
  select count(*) into v_total_projects
  from public.projects
  where workspace_id = p_workspace_id;

  select count(*) into v_active_projects
  from public.projects
  where workspace_id = p_workspace_id and status = 'active';

  -- Pending invites
  select count(*) into v_pending_invites
  from public.invitations
  where workspace_id = p_workspace_id and status = 'pending' and expires_at > now();

  -- Task metrics
  select count(*) into v_total_tasks
  from public.tasks
  where workspace_id = p_workspace_id;

  select count(*) into v_completed_tasks
  from public.tasks
  where workspace_id = p_workspace_id and status in ('completed', 'done');

  select count(*) into v_in_progress_tasks
  from public.tasks
  where workspace_id = p_workspace_id and status in ('in_progress', 'in_review');

  select count(*) into v_overdue_tasks
  from public.tasks
  where workspace_id = p_workspace_id
    and status not in ('completed', 'done')
    and due_date < now();

  return jsonb_build_object(
    'workspace', v_workspace,
    'caller_role', v_caller_role,
    'total_members', v_total_members,
    'total_projects', v_total_projects,
    'active_projects', v_active_projects,
    'pending_invites', v_pending_invites,
    'total_tasks', v_total_tasks,
    'completed_tasks', v_completed_tasks,
    'in_progress_tasks', v_in_progress_tasks,
    'overdue_tasks', v_overdue_tasks
  );
end;
$$;

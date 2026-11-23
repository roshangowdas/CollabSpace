-- ==============================================================================
-- CollabSpace Migration: Secure Workspace Invitations & Multi-Role Support
-- Migration: 20240106000000_workspace_invitations.sql
-- Description: Extends role constraints to support Admin, Developer, Designer,
--              Tester, Member. Implements secure token generation, verification,
--              expiration handling, duplicate prevention, and revocation.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. UPDATE ROLE CONSTRAINTS FOR WORKSPACE MEMBERS & INVITATIONS
-- ------------------------------------------------------------------------------

-- Update workspace_members role constraint to support full role roster
alter table public.workspace_members
  drop constraint if exists workspace_members_role_check;

alter table public.workspace_members
  add constraint workspace_members_role_check
  check (role in ('Owner', 'Admin', 'Developer', 'Designer', 'Tester', 'Member', 'Viewer'));

-- Update invitations role constraint (Owner is STRICTLY excluded)
alter table public.invitations
  drop constraint if exists invitations_role_check;

alter table public.invitations
  add constraint invitations_role_check
  check (role in ('Admin', 'Developer', 'Designer', 'Tester', 'Member'));

-- Update invitations status constraint to include 'revoked'
alter table public.invitations
  drop constraint if exists invitations_status_check;

alter table public.invitations
  add constraint invitations_status_check
  check (status in ('pending', 'accepted', 'declined', 'expired', 'revoked'));

-- Partial unique index: only ONE active pending invite per email per workspace
create unique index if not exists idx_invitations_workspace_email_pending
  on public.invitations (workspace_id, lower(email))
  where status = 'pending';

-- ------------------------------------------------------------------------------
-- 2. SECURE SERVER-SIDE RPC FUNCTIONS
-- ------------------------------------------------------------------------------

-- 2.1 Create Workspace Invitation (Privileged, validates caller is Owner or Admin)
create or replace function public.create_workspace_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  clean_email text := lower(trim(p_email));
  secure_token text;
  inv_id uuid;
  ws_name text;
begin
  -- 1. Authentication check
  if caller_id is null then
    raise exception 'Unauthorized: Authentication required.';
  end if;

  -- 2. Authorization check: caller must be Owner or Admin
  if not public.has_workspace_role(p_workspace_id, array['Owner', 'Admin']) then
    raise exception 'Forbidden: Only workspace Owners and Admins can create invitations.';
  end if;

  -- 3. Validate Role: Owner role is prohibited
  if p_role not in ('Admin', 'Developer', 'Designer', 'Tester', 'Member') then
    raise exception 'Invalid role. Permitted invite roles are Admin, Developer, Designer, Tester, Member.';
  end if;

  -- 4. Validate Email format
  if clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Invalid email address format.';
  end if;

  -- 5. Prevent duplicate membership: Check if user is already a member
  if exists (
    select 1
    from public.workspace_members wm
    join public.profiles p on p.id = wm.user_id
    join auth.users u on u.id = p.id
    where wm.workspace_id = p_workspace_id
      and lower(u.email) = clean_email
  ) then
    raise exception 'This user is already an active member of this workspace.';
  end if;

  -- 6. Invalidate any previous pending invitations for this email in this workspace
  update public.invitations
  set status = 'revoked', updated_at = now()
  where workspace_id = p_workspace_id
    and lower(email) = clean_email
    and status = 'pending';

  -- 7. Generate cryptographically secure 64-char token
  secure_token := encode(gen_random_bytes(32), 'hex');

  -- 8. Fetch workspace name
  select name into ws_name from public.workspaces where id = p_workspace_id;

  -- 9. Insert new invitation with 7-day expiration
  insert into public.invitations (
    workspace_id,
    email,
    role,
    token,
    invited_by,
    status,
    expires_at,
    created_at,
    updated_at
  )
  values (
    p_workspace_id,
    clean_email,
    p_role,
    secure_token,
    caller_id,
    'pending',
    now() + interval '7 days',
    now(),
    now()
  )
  returning id into inv_id;

  -- 10. Audit log
  insert into public.activity_logs (
    workspace_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_title,
    details
  )
  values (
    p_workspace_id,
    caller_id,
    'invited',
    'member',
    inv_id,
    clean_email,
    jsonb_build_object('role', p_role, 'email', clean_email)
  );

  return jsonb_build_object(
    'id', inv_id,
    'workspace_id', p_workspace_id,
    'workspace_name', ws_name,
    'email', clean_email,
    'role', p_role,
    'token', secure_token,
    'expires_at', (now() + interval '7 days')
  );
end;
$$;

-- 2.2 Get Invitation Details by Token (Public lookup for invitation page)
create or replace function public.get_invitation_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  ws record;
  inviter record;
  is_expired boolean;
begin
  select * into inv
  from public.invitations
  where token = p_token;

  if inv.id is null then
    return jsonb_build_object('valid', false, 'reason', 'Invitation token was not found.');
  end if;

  if inv.status = 'revoked' then
    return jsonb_build_object('valid', false, 'reason', 'This invitation has been revoked by a workspace administrator.');
  end if;

  if inv.status = 'accepted' then
    return jsonb_build_object('valid', false, 'reason', 'This invitation has already been accepted.');
  end if;

  is_expired := (inv.expires_at < now());
  if is_expired then
    -- Mark as expired
    update public.invitations set status = 'expired', updated_at = now() where id = inv.id;
    return jsonb_build_object('valid', false, 'reason', 'This invitation has expired.');
  end if;

  select id, name, slug, logo_url into ws
  from public.workspaces
  where id = inv.workspace_id;

  select id, full_name, avatar_url into inviter
  from public.profiles
  where id = inv.invited_by;

  return jsonb_build_object(
    'valid', true,
    'id', inv.id,
    'workspace_id', ws.id,
    'workspace_name', ws.name,
    'workspace_slug', ws.slug,
    'workspace_logo', ws.logo_url,
    'email', inv.email,
    'role', inv.role,
    'expires_at', inv.expires_at,
    'inviter_name', coalesce(inviter.full_name, 'A team administrator')
  );
end;
$$;

-- 2.3 Accept Workspace Invitation (Verifies caller identity & email matching)
create or replace function public.accept_workspace_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text;
  inv record;
  ws record;
begin
  -- 1. Ensure authenticated
  if caller_id is null then
    raise exception 'Authentication required to accept an invitation. Please log in or register.';
  end if;

  -- 2. Fetch caller email from auth.users
  select lower(email) into caller_email
  from auth.users
  where id = caller_id;

  -- 3. Lookup invitation
  select * into inv
  from public.invitations
  where token = p_token;

  if inv.id is null then
    raise exception 'Invalid invitation token.';
  end if;

  if inv.status = 'revoked' then
    raise exception 'This invitation has been revoked by an administrator.';
  end if;

  if inv.status = 'accepted' then
    select id, name, slug into ws from public.workspaces where id = inv.workspace_id;
    return jsonb_build_object(
      'success', true,
      'already_member', true,
      'workspace_id', ws.id,
      'workspace_name', ws.name,
      'workspace_slug', ws.slug
    );
  end if;

  if inv.expires_at < now() then
    update public.invitations set status = 'expired', updated_at = now() where id = inv.id;
    raise exception 'This invitation has expired.';
  end if;

  -- 4. Identity & Email Verification: Ensure caller email matches invitation target
  if lower(inv.email) != caller_email then
    raise exception 'Email mismatch: This invitation was sent to % but you are signed in as %.', inv.email, caller_email;
  end if;

  -- 5. Prevent duplicate membership (insert or ignore if already member)
  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, caller_id, inv.role)
  on conflict (workspace_id, user_id) do update set
    role = excluded.role,
    updated_at = now();

  -- 6. Mark invitation as accepted
  update public.invitations
  set status = 'accepted', updated_at = now()
  where id = inv.id;

  -- 7. Fetch workspace info for redirect
  select id, name, slug into ws from public.workspaces where id = inv.workspace_id;

  -- 8. Audit log
  insert into public.activity_logs (
    workspace_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_title,
    details
  )
  values (
    inv.workspace_id,
    caller_id,
    'joined',
    'member',
    caller_id,
    caller_email,
    jsonb_build_object('role', inv.role, 'invitation_id', inv.id)
  );

  return jsonb_build_object(
    'success', true,
    'workspace_id', ws.id,
    'workspace_name', ws.name,
    'workspace_slug', ws.slug,
    'role', inv.role
  );
end;
$$;

-- 2.4 Revoke Workspace Invitation (Owners and Admins only)
create or replace function public.revoke_workspace_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  inv record;
begin
  select * into inv from public.invitations where id = p_invitation_id;
  if inv.id is null then
    raise exception 'Invitation not found.';
  end if;

  if not public.has_workspace_role(inv.workspace_id, array['Owner', 'Admin']) then
    raise exception 'Forbidden: Only Owners and Admins can revoke invitations.';
  end if;

  update public.invitations
  set status = 'revoked', updated_at = now()
  where id = p_invitation_id;

  insert into public.activity_logs (
    workspace_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_title
  )
  values (
    inv.workspace_id,
    caller_id,
    'deleted',
    'member',
    p_invitation_id,
    inv.email
  );

  return true;
end;
$$;

-- ------------------------------------------------------------------------------
-- 3. RLS POLICIES FOR INVITATIONS
-- ------------------------------------------------------------------------------
drop policy if exists "Workspace members and invitees can view invitation" on public.invitations;
drop policy if exists "Owners and Admins can create invitations" on public.invitations;
drop policy if exists "Owners Admins or invitee can update invitation" on public.invitations;
drop policy if exists "Owners and Admins can delete invitations" on public.invitations;

-- View policy: Owners/Admins see pending invitations; invitees see their own invite
create policy "Workspace members and invitees can view invitation"
  on public.invitations for select
  to authenticated
  using (
    public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
    or lower(email) = lower(auth.jwt()->>'email')
  );

create policy "Owners and Admins can create invitations"
  on public.invitations for insert
  to authenticated
  with check (
    public.has_workspace_role(workspace_id, array['Owner', 'Admin'])
    and auth.uid() = invited_by
  );

create policy "Owners and Admins can update invitations"
  on public.invitations for update
  to authenticated
  using (public.has_workspace_role(workspace_id, array['Owner', 'Admin']))
  with check (public.has_workspace_role(workspace_id, array['Owner', 'Admin']));

create policy "Owners and Admins can delete invitations"
  on public.invitations for delete
  to authenticated
  using (public.has_workspace_role(workspace_id, array['Owner', 'Admin']));


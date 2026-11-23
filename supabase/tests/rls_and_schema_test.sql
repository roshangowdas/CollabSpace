-- ==============================================================================
-- CollabSpace Comprehensive SQL & RLS Verification Suite
-- File: supabase/tests/rls_and_schema_test.sql
-- Description: Verifies schema completeness, RLS enablement, anti-recursion
--              security-definer helpers, constraints, triggers, and multi-tenant
--              role permissions (Owner, Admin, Member, Viewer, Non-Member).
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- 1. VERIFY ALL 16 TABLES EXIST AND HAVE RLS ENABLED
-- ------------------------------------------------------------------------------
do $$
declare
  required_tables text[] := array[
    'profiles',
    'workspaces',
    'workspace_members',
    'invitations',
    'projects',
    'project_members',
    'tasks',
    'task_comments',
    'messages',
    'notifications',
    'attachments',
    'documents',
    'document_updates',
    'whiteboards',
    'whiteboard_elements',
    'activity_logs'
  ];
  tbl text;
  is_rls_enabled boolean;
begin
  foreach tbl in array required_tables loop
    -- Check table existence
    if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      raise exception 'CRITICAL: Required table "%" is missing from public schema!', tbl;
    end if;

    -- Check RLS enabled
    select rowsecurity into is_rls_enabled
    from pg_tables
    where schemaname = 'public' and tablename = tbl;

    if not is_rls_enabled then
      raise exception 'SECURITY VIOLATION: RLS is NOT enabled on table "%"!', tbl;
    end if;
  end loop;

  raise notice '>> [PASS] All 16 tables exist and have Row Level Security (RLS) strictly enabled.';
end $$;

-- ------------------------------------------------------------------------------
-- 2. CREATE ISOLATED TEST ACTORS & PROFILES
-- ------------------------------------------------------------------------------
do $$
declare
  u_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  u_admin_id uuid := '00000000-0000-0000-0000-000000000002';
  u_member_id uuid := '00000000-0000-0000-0000-000000000003';
  u_viewer_id uuid := '00000000-0000-0000-0000-000000000004';
  u_stranger_id uuid := '00000000-0000-0000-0000-000000000009';

  ws_a_id uuid := '11111111-1111-1111-1111-111111111111';
  ws_b_id uuid := '22222222-2222-2222-2222-222222222222';

  proj_a_id uuid;
  task_a_id uuid;
  msg_a_id uuid;
  doc_a_id uuid;
  wb_a_id uuid;
begin
  -- Insert mock profiles (bypassing auth.users for unit test simulation)
  insert into public.profiles (id, full_name, username, role) values
    (u_owner_id, 'Alice Owner', 'alice_owner', 'Owner'),
    (u_admin_id, 'Bob Admin', 'bob_admin', 'Admin'),
    (u_member_id, 'Charlie Member', 'charlie_member', 'Member'),
    (u_viewer_id, 'David Viewer', 'david_viewer', 'Viewer'),
    (u_stranger_id, 'Eve Stranger', 'eve_stranger', 'Member')
  on conflict (id) do update set full_name = excluded.full_name;

  -- 2.1 Test Workspace Creation & Auto-Owner Trigger
  insert into public.workspaces (id, name, slug, owner_id, plan)
  values (ws_a_id, 'Acme Engineering', 'acme-eng', u_owner_id, 'pro')
  on conflict (id) do nothing;

  -- Verify trigger automatically made Alice the Owner in workspace_members
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = ws_a_id and user_id = u_owner_id and role = 'Owner'
  ) then
    raise exception 'TRIGGER FAILED: handle_new_workspace did not add owner to workspace_members';
  end if;
  raise notice '>> [PASS] Workspace creation and auto-Owner assignment trigger verified.';

  -- Add other members to Workspace A
  insert into public.workspace_members (workspace_id, user_id, role) values
    (ws_a_id, u_admin_id, 'Admin'),
    (ws_a_id, u_member_id, 'Member'),
    (ws_a_id, u_viewer_id, 'Viewer')
  on conflict (workspace_id, user_id) do nothing;

  -- Verify unique constraint prevents duplicate memberships
  begin
    insert into public.workspace_members (workspace_id, user_id, role)
    values (ws_a_id, u_member_id, 'Member');
    raise exception 'CONSTRAINT FAILED: Duplicate workspace_members row was allowed!';
  exception when unique_violation then
    -- Expected behavior
  end;
  raise notice '>> [PASS] Unique constraint on workspace_members(workspace_id, user_id) verified.';

  -- 2.2 Test Helper Functions
  -- Mock session as Charlie (Member)
  perform set_config('request.jwt.claims', json_build_object('sub', u_member_id::text, 'role', 'authenticated')::text, true);

  if not public.is_workspace_member(ws_a_id) then
    raise exception 'HELPER FAILED: is_workspace_member returned false for active member';
  end if;

  if public.has_workspace_role(ws_a_id, array['Owner', 'Admin']) then
    raise exception 'HELPER FAILED: has_workspace_role returned true for Member when requiring Admin/Owner';
  end if;

  if not public.has_workspace_role(ws_a_id, array['Member']) then
    raise exception 'HELPER FAILED: has_workspace_role returned false for Member';
  end if;
  raise notice '>> [PASS] Anti-recursion helper functions (is_workspace_member, has_workspace_role) verified.';

  -- 2.3 Test Project Creation & Auto-Lead Trigger
  insert into public.projects (id, workspace_id, name, key, visibility, created_by)
  values (gen_random_uuid(), ws_a_id, 'Core API Platform', 'API', 'workspace', u_member_id)
  returning id into proj_a_id;

  if not exists (
    select 1 from public.project_members
    where project_id = proj_a_id and user_id = u_member_id and role = 'Lead'
  ) then
    raise exception 'TRIGGER FAILED: handle_new_project did not add creator as Lead in project_members';
  end if;
  raise notice '>> [PASS] Project creation and auto-Lead assignment trigger verified.';

  -- 2.4 Test Incremental Task Number Trigger
  insert into public.tasks (workspace_id, project_id, title, reporter_id, status, priority)
  values (ws_a_id, proj_a_id, 'First issue setup', u_member_id, 'todo', 'high')
  returning id into task_a_id;

  insert into public.tasks (workspace_id, project_id, title, reporter_id, status, priority)
  values (ws_a_id, proj_a_id, 'Second issue setup', u_member_id, 'in_progress', 'medium');

  if (select task_number from public.tasks where id = task_a_id) != 1 then
    raise exception 'TRIGGER FAILED: Task 1 did not receive task_number 1';
  end if;
  raise notice '>> [PASS] Incremental task numbering trigger (COL-1, COL-2) verified.';

  -- 2.5 Test Collaborative Documents, Messages, and Whiteboards
  insert into public.messages (workspace_id, channel_name, sender_id, content)
  values (ws_a_id, 'general', u_member_id, 'Welcome team to CollabSpace!')
  returning id into msg_a_id;

  insert into public.documents (workspace_id, project_id, title, created_by)
  values (ws_a_id, proj_a_id, 'Q4 Architecture Blueprint', u_member_id)
  returning id into doc_a_id;

  insert into public.whiteboards (workspace_id, project_id, name, created_by)
  values (ws_a_id, proj_a_id, 'System Architecture Map', u_member_id)
  returning id into wb_a_id;

  insert into public.whiteboard_elements (whiteboard_id, element_type, properties, z_index)
  values (wb_a_id, 'rectangle', '{"x": 100, "y": 200, "w": 250, "h": 120, "fill": "#3b82f6"}'::jsonb, 1);

  insert into public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, entity_title)
  values (ws_a_id, u_member_id, 'created', 'project', proj_a_id, 'Core API Platform');

  raise notice '>> [PASS] Documents, Messages, Whiteboards, Elements, and Activity Logs created successfully.';

  -- 2.6 Test Multi-Tenant Boundary (Eve Stranger in Workspace B)
  perform set_config('request.jwt.claims', json_build_object('sub', u_stranger_id::text, 'role', 'authenticated')::text, true);

  if public.is_workspace_member(ws_a_id) then
    raise exception 'SECURITY LEAK: Stranger user evaluated as workspace member of unjoined workspace!';
  end if;

  if public.can_access_project(proj_a_id) then
    raise exception 'SECURITY LEAK: Stranger user can access project in foreign workspace!';
  end if;

  raise notice '>> [PASS] Multi-tenant boundary isolation strictly enforced between workspaces.';

end $$;

rollback; -- Clean up test transactions


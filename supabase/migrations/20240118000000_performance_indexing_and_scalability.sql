-- ==============================================================================
-- CollabSpace Database Performance, Caching & Scalability Migration
-- Migration: 20240118000000_performance_indexing_and_scalability.sql
-- Description:
--   High-performance composite, partial, and covering indexes engineered for
--   high-concurrency workloads (10,000+ users).
--
-- Features:
--   1. RLS membership lookup acceleration (Index-Only Scans on workspace_members).
--   2. Multi-column composite indexes for Kanban sorting & status filters.
--   3. Partial indexes for active uncompleted tasks, unread notifications & chat feeds.
--   4. Project member and document indexing for zero-lock reads.
--   5. Activity log reverse-chronological indexing for high-speed audit pagination.
--   6. Verification benchmarks and EXPLAIN ANALYZE execution templates.
-- ==============================================================================

-- ==============================================================================
-- 1. PROFILES PERFORMANCE INDEXES
-- ==============================================================================

-- Accelerate user mentions and profile autocomplete searches
create index if not exists idx_profiles_username_prefix
  on public.profiles (lower(username) text_pattern_ops);

create index if not exists idx_profiles_full_name_prefix
  on public.profiles (lower(full_name) text_pattern_ops);

-- Accelerate active role checks on profiles
create index if not exists idx_profiles_role
  on public.profiles (role) where role in ('Owner', 'Admin');


-- ==============================================================================
-- 2. WORKSPACE MEMBERS & RLS ACCELERATION INDEXES
-- ==============================================================================

-- Ultra-critical for Row Level Security (RLS) performance:
-- RLS policies execute: WHERE user_id = auth.uid() and select workspace_id.
-- This 3-column composite index provides an Index-Only Scan with 0 heap fetches.
create index if not exists idx_workspace_members_user_ws_role
  on public.workspace_members (user_id, workspace_id, role);

-- Accelerate member directory listings ordered by membership date
create index if not exists idx_workspace_members_ws_created
  on public.workspace_members (workspace_id, created_at desc);


-- ==============================================================================
-- 3. WORKSPACES
-- ==============================================================================

-- Accelerate workspace switcher for users who own multiple workspaces
create index if not exists idx_workspaces_owner_created
  on public.workspaces (owner_id, created_at desc);


-- ==============================================================================
-- 4. PROJECTS PERFORMANCE INDEXES
-- ==============================================================================

-- High-speed project listing ordered by most recently updated
create index if not exists idx_projects_ws_updated
  on public.projects (workspace_id, updated_at desc);

-- Filtered project queries by status with updated_at sort
create index if not exists idx_projects_ws_status_updated
  on public.projects (workspace_id, status, updated_at desc);


-- ==============================================================================
-- 5. PROJECT MEMBERS & PROJECT-LEVEL RLS
-- ==============================================================================

-- Accelerates task, message, and document RLS checks:
-- RLS checks: WHERE user_id = auth.uid() for project_id
create index if not exists idx_project_members_user_proj_role
  on public.project_members (user_id, project_id, role);

create index if not exists idx_project_members_proj_role
  on public.project_members (project_id, role);


-- ==============================================================================
-- 6. TASKS & KANBAN ACCELERATION INDEXES
-- ==============================================================================

-- Kanban Board Sorting: Project tasks ordered by position and creation
-- Eliminates Sort nodes in EXPLAIN ANALYZE for Kanban column renders
create index if not exists idx_tasks_proj_pos_created
  on public.tasks (project_id, position asc, created_at desc);

-- Kanban status-filtered position ordering
create index if not exists idx_tasks_proj_status_pos
  on public.tasks (project_id, status, position asc);

-- Workspace-wide task boards & timeline views
create index if not exists idx_tasks_ws_pos_created
  on public.tasks (workspace_id, position asc, created_at desc);

-- "My Tasks" page & user assignee queries
create index if not exists idx_tasks_assignee_status_due
  on public.tasks (assignee_id, status, due_date);

-- Partial index for active (uncompleted) tasks:
-- Vastly smaller index size than full table; speeds up active task queries
create index if not exists idx_tasks_active_uncompleted
  on public.tasks (workspace_id, due_date)
  where status not in ('completed', 'done', 'canceled');

-- Partial index for overdue task alerts
create index if not exists idx_tasks_overdue_alerts
  on public.tasks (workspace_id, due_date)
  where status not in ('completed', 'done', 'canceled') and due_date is not null;


-- ==============================================================================
-- 7. TASK COMMENTS
-- ==============================================================================

-- Accelerate task drawer comment thread retrieval in chronological order
create index if not exists idx_task_comments_task_created_asc
  on public.task_comments (task_id, created_at asc);


-- ==============================================================================
-- 8. MESSAGES (PROJECT CHAT & REALTIME)
-- ==============================================================================

-- High-velocity reverse-chronological chat query:
-- SELECT ... FROM messages WHERE project_id = $1 ORDER BY created_at DESC LIMIT 50;
create index if not exists idx_messages_proj_created_desc
  on public.messages (project_id, created_at desc);

-- Workspace channels reverse-chronological chat query
create index if not exists idx_messages_ws_channel_created_desc
  on public.messages (workspace_id, channel_name, created_at desc);

-- Partial index for top-level channel messages (excludes thread replies)
create index if not exists idx_messages_top_level_desc
  on public.messages (project_id, created_at desc)
  where parent_id is null;


-- ==============================================================================
-- 9. NOTIFICATIONS
-- ==============================================================================

-- User notification drawer in reverse chronological order
create index if not exists idx_notifications_user_created_desc
  on public.notifications (user_id, created_at desc);

-- Ultra-compact partial index for unread notification badge counts
create index if not exists idx_notifications_unread_badge
  on public.notifications (user_id)
  where is_read = false;


-- ==============================================================================
-- 10. DOCUMENTS (CRDT & SPECS)
-- ==============================================================================

-- Active collaborative documents sorted by last edit
create index if not exists idx_documents_proj_active_updated
  on public.documents (project_id, updated_at desc)
  where is_archived = false;

create index if not exists idx_documents_ws_active_updated
  on public.documents (workspace_id, updated_at desc)
  where is_archived = false;


-- ==============================================================================
-- 11. ACTIVITY LOGS (AUDIT TRAIL)
-- ==============================================================================

-- Workspace audit trail pagination
create index if not exists idx_activity_logs_ws_created_desc
  on public.activity_logs (workspace_id, created_at desc);

-- Entity-specific audit histories (e.g. task history, project audit)
create index if not exists idx_activity_logs_ws_entity_created
  on public.activity_logs (workspace_id, entity_type, entity_id, created_at desc);

-- User-specific activity timeline
create index if not exists idx_activity_logs_user_created_desc
  on public.activity_logs (user_id, created_at desc);


-- ==============================================================================
-- 12. EXPLAIN ANALYZE BENCHMARK TEMPLATES
-- ==============================================================================
-- Run these queries in the Supabase SQL Editor to verify index hits and timings:
--
-- 1. Kanban Task Index Scan:
--    EXPLAIN ANALYZE
--    SELECT id, title, status, position FROM public.tasks
--    WHERE project_id = '00000000-0000-0000-0000-000000000000'
--    ORDER BY position ASC, created_at DESC
--    LIMIT 100;
--
-- 2. RLS Membership Index-Only Scan:
--    EXPLAIN ANALYZE
--    SELECT workspace_id, role FROM public.workspace_members
--    WHERE user_id = '00000000-0000-0000-0000-000000000000';
--
-- 3. Reverse-Chronological Chat Pagination:
--    EXPLAIN ANALYZE
--    SELECT id, content, created_at FROM public.messages
--    WHERE project_id = '00000000-0000-0000-0000-000000000000'
--    ORDER BY created_at DESC
--    LIMIT 50;
--
-- 4. Unread Notification Count Partial Scan:
--    EXPLAIN ANALYZE
--    SELECT count(*) FROM public.notifications
--    WHERE user_id = '00000000-0000-0000-0000-000000000000' AND is_read = false;
-- ==============================================================================

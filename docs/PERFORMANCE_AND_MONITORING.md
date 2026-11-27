# CollabSpace – Database Performance, Monitoring & Scalability Guide 📈

This document provides architectural instructions for managing, monitoring, and scaling CollabSpace under high-concurrency production workloads (thousands of concurrent users).

---

## 1. 🔍 Slow Query Monitoring (PostgreSQL `pg_stat_statements`)

Supabase includes the `pg_stat_statements` PostgreSQL extension enabled by default. This extension records execution statistics for all SQL queries executed against the database.

### Query 1: Top 10 Slowest Queries by Average Execution Time
Run this query in the **Supabase SQL Editor**:

```sql
SELECT 
  round((total_exec_time / 1000)::numeric, 2) AS total_sec,
  round((mean_exec_time)::numeric, 2) AS avg_ms,
  calls,
  rows,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Query 2: Queries Consuming the Most Total CPU Time
```sql
SELECT 
  round((total_exec_time / 1000)::numeric, 2) AS total_sec,
  round((mean_exec_time)::numeric, 2) AS avg_ms,
  calls,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Query 3: Identifying Sequential Scans vs. Index Scans
Check which tables are experiencing sequential scans instead of index scans:

```sql
SELECT 
  relname AS table_name,
  seq_scan AS sequential_scans,
  idx_scan AS index_scans,
  round((100.0 * idx_scan / nullif(seq_scan + idx_scan, 0))::numeric, 2) AS index_hit_percentage
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```
> 💡 **Target**: Maintain `index_hit_percentage` above **98%** across all tables.

---

## 2. 🎛️ Supabase Dashboard Metrics

In your [Supabase Project Dashboard](https://supabase.com/dashboard) ➔ **Reports ➔ Database**:

| Metric | Healthy Threshold | Action When Elevated |
| :--- | :---: | :--- |
| **CPU Usage** | `< 60%` | Inspect queries with high `total_exec_time`; verify composite indexes. |
| **RAM (Memory)** | `< 75%` | Normal for PostgreSQL buffer pool; ensure shared_buffers hit ratio > 99%. |
| **Disk IOPS** | Within tier burst limits | Check for unindexed sorting (`ORDER BY`) forcing disk spills. |
| **Active Connections** | `< 80%` of direct pool | Switch backend calls to Supavisor connection pooler (port `6543`). |
| **Realtime Messages** | `< 250 msg/sec` | Use channel broadcast instead of database CDC for typing/mouse states. |

---

## 3. 🔌 Connection Pool Management (Supavisor)

For serverless backend environments and high-concurrency Node.js microservices:

1. **Transaction Mode (Port 6543)**:
   - Use for stateless backend API routes and microservices where transactions are short-lived.
   - Connection URL:
     ```
     postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
2. **Session Mode (Port 5432)**:
   - Use for direct database migrations, schema edits, and stateful persistent servers.

---

## 4. 🧪 Running Progressive Load Tests

We provide two load-testing tools in `scripts/load-testing/`:

### Option A: Standalone Node.js Load Simulation (No dependencies required)
Tests 50, 100, 250, 500, and 1,000 concurrent operations measuring average response time, p95, p99, and error rate:

```bash
node scripts/load-testing/run_load_simulation.js
```

### Option B: k6 Load Test Suite
Simulates realistic HTTP virtual users against live REST and Realtime endpoints:

```bash
# Install k6 (if not already installed)
# Windows: winget install k6 --source winget
# macOS: brew install k6

# Run progressive stages
k6 run scripts/load-testing/k6-load-test.js
```

---

## 5. ⚡ Caching & Query Optimization Cheatsheet

1. **Scoped Query Keys**: Always include `userId` and `workspaceId` in React Query keys (`queryKeys.tasks(workspaceId, projectId)`).
2. **Purge on Logout**: Call `clearPrivateCache()` on logout to prevent cross-user data leakage.
3. **Parallel Execution**: Never chain independent database requests sequentially. Use `Promise.all([q1, q2, q3])`.
4. **Prune Columns**: Only select columns actively used by the view (`id, title, status, position`). Avoid `select('*')`.
5. **Realtime Channels**: Use `createBroadcastChannel` for transient ephemeral events (typing indicators, canvas cursors).

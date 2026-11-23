import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const migrationPath = path.resolve(__dirname, '../supabase/migrations/20240104000000_complete_database_schema.sql')
const sql = fs.readFileSync(migrationPath, 'utf8')

console.log('--- CollabSpace Database Schema Validator ---')
console.log('Reading migration:', migrationPath)

const requiredTables = [
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
  'activity_logs',
]

// 1. Verify Table Definitions
console.log('\n[1/6] Verifying Table Definitions:')
let missingTables = []
for (const table of requiredTables) {
  const tableRegex = new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${table}\\s*\\(`, 'i')
  if (tableRegex.test(sql)) {
    console.log(`  ✓ Table public.${table} defined`)
  } else {
    console.error(`  ✗ MISSING Table: public.${table}`)
    missingTables.push(table)
  }
}

if (missingTables.length > 0) {
  console.error('\nFAILED: Missing tables:', missingTables)
  process.exit(1)
}

// 2. Verify RLS Enablement on all 16 tables
console.log('\n[2/6] Verifying Row Level Security (RLS) Enablement:')
let missingRls = []
for (const table of requiredTables) {
  const rlsRegex = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security;`, 'i')
  if (rlsRegex.test(sql)) {
    console.log(`  ✓ RLS enabled for public.${table}`)
  } else {
    console.error(`  ✗ RLS missing for public.${table}`)
    missingRls.push(table)
  }
}

if (missingRls.length > 0) {
  console.error('\nFAILED: Missing RLS on tables:', missingRls)
  process.exit(1)
}

// 3. Verify Anti-Recursion Security Definer Functions
console.log('\n[3/6] Verifying Anti-Recursion Security Definer Helper Functions:')
const requiredFunctions = [
  'is_workspace_member',
  'get_workspace_role',
  'has_workspace_role',
  'can_access_project',
  'can_modify_project',
]

for (const fn of requiredFunctions) {
  const fnRegex = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${fn}\\b[\\s\\S]*?security\\s+definer`, 'i')
  if (fnRegex.test(sql)) {
    console.log(`  ✓ Security definer helper public.${fn}() declared`)
  } else {
    console.error(`  ✗ Missing security definer helper: public.${fn}()`)
    process.exit(1)
  }
}

// 4. Verify Constraints (Unique & Checks)
console.log('\n[4/6] Verifying Unique & Check Constraints:')
const expectedConstraints = [
  { table: 'workspace_members', pattern: /unique\s*\(\s*workspace_id\s*,\s*user_id\s*\)/i, label: 'unique(workspace_id, user_id)' },
  { table: 'project_members', pattern: /unique\s*\(\s*project_id\s*,\s*user_id\s*\)/i, label: 'unique(project_id, user_id)' },
  { table: 'projects', pattern: /unique\s*\(\s*workspace_id\s*,\s*key\s*\)/i, label: 'unique(workspace_id, key)' },
  { table: 'tasks', pattern: /unique\s*\(\s*project_id\s*,\s*task_number\s*\)/i, label: 'unique(project_id, task_number)' },
  { table: 'document_updates', pattern: /unique\s*\(\s*document_id\s*,\s*version_number\s*\)/i, label: 'unique(document_id, version_number)' },
  { table: 'profiles', pattern: /check\s*\(\s*role\s+in\s*\('Owner',\s*'Admin',\s*'Member',\s*'Viewer'\)\)/i, label: 'profiles role check' },
  { table: 'workspace_members', pattern: /check\s*\(\s*role\s+in\s*\('Owner',\s*'Admin',\s*'Member',\s*'Viewer'\)\)/i, label: 'workspace_members role check' },
  { table: 'tasks', pattern: /status\s+in\s*\('backlog',\s*'todo',\s*'in_progress',\s*'in_review',\s*'done',\s*'canceled'\)/i, label: 'task status check' },
  { table: 'tasks', pattern: /priority\s+in\s*\('low',\s*'medium',\s*'high',\s*'urgent'\)/i, label: 'task priority check' },
]

for (const c of expectedConstraints) {
  if (c.pattern.test(sql)) {
    console.log(`  ✓ Verified constraint: ${c.label} on ${c.table}`)
  } else {
    console.error(`  ✗ Missing constraint: ${c.label} on ${c.table}`)
    process.exit(1)
  }
}

// 5. Verify Automated Business Logic Triggers
console.log('\n[5/6] Verifying Automated Triggers:')
const triggers = [
  'on_workspace_created',
  'on_project_created',
  'on_task_before_insert',
]

for (const trg of triggers) {
  const trgRegex = new RegExp(`create\\s+trigger\\s+${trg}\\b`, 'i')
  if (trgRegex.test(sql)) {
    console.log(`  ✓ Trigger ${trg} declared`)
  } else {
    console.error(`  ✗ Missing trigger: ${trg}`)
    process.exit(1)
  }
}

// 6. Verify Policy Strictness on all tenant tables
console.log('\n[6/6] Verifying Policy Strictness:')
const tenantTables = [
  'workspaces',
  'workspace_members',
  'projects',
  'project_members',
  'tasks',
  'task_comments',
  'messages',
  'documents',
  'document_updates',
  'whiteboards',
  'whiteboard_elements',
  'attachments',
  'activity_logs',
]

// Split SQL statements by semicolon
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.startsWith('create policy') || s.startsWith('CREATE POLICY'))

for (const table of tenantTables) {
  const tablePolicies = statements.filter(stmt => {
    return new RegExp(`\\bon\\s+public\\.${table}\\b`, 'i').test(stmt)
  })

  for (const pol of tablePolicies) {
    if (/using\s*\(\s*true\s*\)/i.test(pol)) {
      console.error(`  ✗ SECURITY VIOLATION: Insecure USING (true) found on table public.${table}:`)
      console.error(pol)
      process.exit(1)
    }
    if (/with\s+check\s*\(\s*true\s*\)/i.test(pol)) {
      console.error(`  ✗ SECURITY VIOLATION: Insecure WITH CHECK (true) found on table public.${table}:`)
      console.error(pol)
      process.exit(1)
    }
  }

  console.log(`  ✓ Table public.${table} has strictly scoped policies (${tablePolicies.length} policies verified)`)
}

console.log('\nAll 6 database verification checks passed successfully!')

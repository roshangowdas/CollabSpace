// ==============================================================================
// CollabSpace Security Audit Test Suite
// File: scripts/test_security_audit.js
// Description:
//   Executes tests across all 16 security audit requirements:
//   1. Supabase RLS coverage on all 16 application tables
//   2. Private storage bucket configurations & RLS policies
//   3. Secret management & absence of exposed credentials in src/
//   4. URL ID parameter tampering & cross-workspace isolation
//   5. Role-based authorization & privilege escalation prevention
//   6. Invitation token validation & expiration security
//   7. File upload validation & path traversal prevention
//   8. Rate limiting for sensitive operations
//   9. WebSocket authentication & document access authorization
//   10. XSS & SQL injection protection
// ==============================================================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('==============================================================================')
console.log('             COLLABSPACE STAGE 23 - SECURITY AUDIT VERIFICATION               ')
console.log('==============================================================================\n')

const vite = await createServer()

let passedTests = 0
let failedTests = 0

function runTest(name, fn) {
  try {
    fn()
    console.log(`  [PASS] ${name}`)
    passedTests++
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`)
    failedTests++
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn()
    console.log(`  [PASS] ${name}`)
    passedTests++
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`)
    failedTests++
  }
}

try {
  const { sanitizeFileName, validateFile } = await vite.ssrLoadModule('/src/services/files.js')
  const {
    checkRateLimit,
    consumeRateLimit,
    resetRateLimits,
    RateLimitExceededError,
    RATE_LIMIT_PRESETS,
  } = await vite.ssrLoadModule('/src/utils/rateLimiter.js')
  const {
    assertAdminAccess,
    updateWorkspaceMemberRole,
    removeWorkspaceMemberAdmin,
  } = await vite.ssrLoadModule('/src/services/admin.js')
  const { verifyInvitationToken } = await vite.ssrLoadModule('/src/services/invitations.js')
  const { getProjectById } = await vite.ssrLoadModule('/src/services/projects.js')
  const { getTaskById } = await vite.ssrLoadModule('/src/services/tasks.js')
  const { verifySupabaseToken, checkDocumentAccess } = await vite.ssrLoadModule('/server/auth.js')

  // -----------------------------------------------------------------------------
  // Test 1: Supabase RLS Coverage on all 16 Application Tables
  // -----------------------------------------------------------------------------
  console.log('--- Domain 1: Row Level Security (RLS) Coverage ---')

  const REQUIRED_TABLES = [
    'profiles',
    'workspaces',
    'workspace_members',
    'workspace_invitations',
    'projects',
    'project_members',
    'tasks',
    'task_comments',
    'attachments',
    'activity_logs',
    'notifications',
    'messages',
    'documents',
    'document_updates',
    'whiteboards',
    'whiteboard_elements',
  ]

  runTest('All 16 application tables have explicit RLS enabled in migrations', () => {
    const migrationsDir = path.join(rootDir, 'supabase', 'migrations')
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))

    let combinedSql = ''
    for (const f of files) {
      combinedSql += '\n' + fs.readFileSync(path.join(migrationsDir, f), 'utf-8').toLowerCase()
    }

    for (const table of REQUIRED_TABLES) {
      const hasEnableRls =
        combinedSql.includes(`alter table public.${table} enable row level security`) ||
        combinedSql.includes(`alter table if exists public.${table} enable row level security`) ||
        combinedSql.includes(`alter table ${table} enable row level security`)
      if (!hasEnableRls) {
        throw new Error(`Table "public.${table}" lacks an explicit enable row level security clause!`)
      }
    }
  })

  // -----------------------------------------------------------------------------
  // Test 2: Storage Bucket Access Policies
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 2: Storage Bucket Security & Access Policies ---')

  runTest('Storage buckets "workspace-files" and "chat-attachments" are set to private (public = false)', () => {
    const hardeningMigration = fs.readFileSync(
      path.join(rootDir, 'supabase', 'migrations', '20240116000000_security_audit_hardening.sql'),
      'utf-8'
    )
    const fileStorageMigration = fs.readFileSync(
      path.join(rootDir, 'supabase', 'migrations', '20240112000000_file_management_storage.sql'),
      'utf-8'
    )

    if (!fileStorageMigration.includes("public = false")) {
      throw new Error('workspace-files bucket is not strictly private')
    }
    if (!hardeningMigration.includes("set public = false") || !hardeningMigration.includes("'chat-attachments'")) {
      throw new Error('chat-attachments bucket is not hardened to private in security audit migration')
    }
  })

  // -----------------------------------------------------------------------------
  // Test 3: Secret Management in Client Source
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 3: Secret Management & Key Leakage Prevention ---')

  runTest('Zero service_role keys or private secret keys exposed in client src/', () => {
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          scanDir(fullPath)
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          if (content.includes('service_role') && !fullPath.includes('server')) {
            // Check for actual service_role key assignment
            if (content.match(/service_role_key\s*=\s*['"][^'"]+['"]/i)) {
              throw new Error(`Hardcoded service_role key found in ${fullPath}`)
            }
          }
          if (content.match(/eyJh[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/)) {
            throw new Error(`Hardcoded raw JWT token detected in ${fullPath}`)
          }
        }
      }
    }
    scanDir(path.join(rootDir, 'src'))
  })

  // -----------------------------------------------------------------------------
  // Test 4: Parameter Tampering & URL ID Tampering Protection
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 4: URL ID Parameter Tampering & Cross-Workspace Isolation ---')

  await runAsyncTest('Non-existent or foreign project IDs return null without default fallback leak', async () => {
    const result = await getProjectById('unknown-foreign-project-id-999')
    if (result !== null) {
      throw new Error(`Expected null for non-existent project ID, but received fallback project: ${result?.name}`)
    }
  })

  await runAsyncTest('Non-existent or foreign task IDs return null without default fallback leak', async () => {
    const result = await getTaskById('unknown-foreign-task-id-999')
    if (result !== null) {
      throw new Error(`Expected null for non-existent task ID, but received fallback task: ${result?.title}`)
    }
  })

  // -----------------------------------------------------------------------------
  // Test 5: Role-Based Authorization & Privilege Escalation Prevention
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 5: Role-Based Authorization & Privilege Boundaries ---')

  runTest('Non-admin roles are rejected from administrative panel', () => {
    const restrictedRoles = ['Developer', 'Designer', 'Tester', 'Member', 'Viewer']
    for (const role of restrictedRoles) {
      let errorThrown = false
      try {
        assertAdminAccess(role)
      } catch {
        errorThrown = true
      }
      if (!errorThrown) {
        throw new Error(`assertAdminAccess failed to block restricted role: ${role}`)
      }
    }
  })

  await runAsyncTest('Self-promotion to Owner is strictly prevented', async () => {
    let errorThrown = false
    try {
      await updateWorkspaceMemberRole({
        workspaceId: 'demo-ws-acme-corp',
        targetUserId: 'demo-user-sarah',
        newRole: 'Owner',
        callerId: 'demo-user-sarah',
        callerRole: 'Admin',
      })
    } catch (err) {
      if (err.message.includes('cannot promote yourself to Owner')) {
        errorThrown = true
      }
    }
    if (!errorThrown) {
      throw new Error('Self-promotion to Owner was not prevented!')
    }
  })

  await runAsyncTest('Admin cannot modify the workspace Owner', async () => {
    let errorThrown = false
    try {
      await updateWorkspaceMemberRole({
        workspaceId: 'demo-ws-acme-corp',
        targetUserId: 'demo-user-collabspace-uuid', // Owner
        newRole: 'Member',
        callerId: 'demo-user-sarah', // Admin
        callerRole: 'Admin',
      })
    } catch (err) {
      if (err.message.includes('Cannot modify the role of the workspace Owner')) {
        errorThrown = true
      }
    }
    if (!errorThrown) {
      throw new Error('Admin was able to demote the workspace Owner!')
    }
  })

  await runAsyncTest('Owner cannot be removed from workspace', async () => {
    let errorThrown = false
    try {
      await removeWorkspaceMemberAdmin({
        workspaceId: 'demo-ws-acme-corp',
        targetUserId: 'demo-user-collabspace-uuid', // Owner
        callerId: 'demo-user-sarah',
        callerRole: 'Admin',
      })
    } catch (err) {
      if (err.message.includes('Cannot remove the workspace Owner')) {
        errorThrown = true
      }
    }
    if (!errorThrown) {
      throw new Error('Workspace Owner removal was not blocked!')
    }
  })

  // -----------------------------------------------------------------------------
  // Test 6: Invitation Token Security
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 6: Invitation Token Security ---')

  await runAsyncTest('Invalid, unknown, or forged invitation tokens are rejected', async () => {
    const result = await verifyInvitationToken('invalid-forged-token-abc-123')
    if (result.valid !== false) {
      throw new Error('Invalid invitation token was accepted as valid!')
    }
  })

  // -----------------------------------------------------------------------------
  // Test 7: File Upload Validation & Path Traversal Prevention
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 7: File Upload Validation & Path Traversal ---')

  runTest('Path traversal characters (../) are stripped from file names', () => {
    const dangerousNames = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\cmd.exe',
      'image/../../test.png',
    ]
    for (const name of dangerousNames) {
      const sanitized = sanitizeFileName(name)
      if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
        throw new Error(`sanitizeFileName failed to strip traversal: "${name}" -> "${sanitized}"`)
      }
    }
  })

  runTest('Executable extensions (.exe, .bat, .cmd, .sh, .ps1) are strictly rejected', () => {
    const dangerousFiles = [
      { name: 'malware.exe', size: 1024 },
      { name: 'script.bat', size: 512 },
      { name: 'exploit.sh', size: 256 },
      { name: 'payload.ps1', size: 512 },
      { name: 'trojan.dll', size: 4096 },
    ]
    for (const file of dangerousFiles) {
      const validation = validateFile(file)
      if (validation.valid) {
        throw new Error(`validateFile allowed dangerous executable: ${file.name}`)
      }
    }
  })

  runTest('Files exceeding maximum allowed size are rejected', () => {
    const oversizedFile = { name: 'huge_archive.zip', size: 100 * 1024 * 1024 } // 100MB
    const validation = validateFile(oversizedFile, { maxSizeBytes: 50 * 1024 * 1024 })
    if (validation.valid) {
      throw new Error('validateFile allowed oversized file!')
    }
  })

  // -----------------------------------------------------------------------------
  // Test 8: Rate Limiting for Sensitive Operations
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 8: Rate Limiting for Sensitive Operations ---')

  runTest('Rate limiter enforces max requests within sliding window and raises RateLimitExceededError', () => {
    resetRateLimits('test:rate_limit_bucket')

    const preset = { maxRequests: 3, windowMs: 10000, label: 'Test Action' }

    // Requests 1, 2, 3 must be allowed
    consumeRateLimit('test:rate_limit_bucket', preset)
    consumeRateLimit('test:rate_limit_bucket', preset)
    consumeRateLimit('test:rate_limit_bucket', preset)

    // 4th request must throw RateLimitExceededError
    let rateLimitCaught = false
    try {
      consumeRateLimit('test:rate_limit_bucket', preset)
    } catch (err) {
      if (err instanceof RateLimitExceededError && err.status === 429) {
        rateLimitCaught = true
      }
    }

    if (!rateLimitCaught) {
      throw new Error('Rate limiter failed to throttle 4th request!')
    }

    resetRateLimits('test:rate_limit_bucket')
  })

  // -----------------------------------------------------------------------------
  // Test 9: WebSocket Authentication & Access Authorization
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 9: WebSocket Authentication & Document Authorization ---')

  await runAsyncTest('WebSocket server rejects empty or null authentication tokens', async () => {
    const user = await verifySupabaseToken(null)
    if (user !== null) {
      throw new Error('WebSocket accepted null authentication token!')
    }
  })

  await runAsyncTest('Document authorization rejects empty document or user IDs', async () => {
    const authorized = await checkDocumentAccess(null, null)
    if (authorized !== false) {
      throw new Error('checkDocumentAccess authorized null credentials!')
    }
  })

  // -----------------------------------------------------------------------------
  // Test 10: XSS & HTML Injection Protection
  // -----------------------------------------------------------------------------
  console.log('\n--- Domain 10: Input Sanitization & XSS Protection ---')

  runTest('File names with XSS script payloads are sanitized safely', () => {
    const xssNames = [
      '<script>alert("xss")</script>.png',
      '"><img src=x onerror=alert(1)>.jpg',
    ]
    for (const name of xssNames) {
      const sanitized = sanitizeFileName(name)
      if (sanitized.includes('<') || sanitized.includes('>') || sanitized.includes('"')) {
        throw new Error(`sanitizeFileName failed to strip HTML/XSS chars: "${name}" -> "${sanitized}"`)
      }
    }
  })

  console.log('\n==============================================================================')
  console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`)
  console.log('==============================================================================')

  if (failedTests > 0) {
    process.exit(1)
  }
} finally {
  await vite.close()
}

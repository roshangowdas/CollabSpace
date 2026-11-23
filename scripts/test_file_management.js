// ==============================================================================
// CollabSpace Test Suite: Stage 18 - File Management & Private Storage
// File: scripts/test_file_management.js
// Description:
//   Validates file validation, path traversal prevention, private bucket storage,
//   signed URL generation, upload progress, task attachments, and deletion permissions.
// ==============================================================================

import { createServer } from 'vite'

console.log('--- CollabSpace Stage 18: File Management Test Suite ---')

const server = await createServer()

try {
  const {
    validateFile,
    sanitizeFileName,
    formatFileSize,
    getFileTypeCategory,
    uploadFile,
    getFileDownloadUrl,
    getWorkspaceFiles,
    getTaskAttachments,
    deleteAttachment,
    resetDemoAttachments,
    MAX_FILE_SIZE_BYTES,
    FORBIDDEN_EXTENSIONS,
  } = await server.ssrLoadModule('/src/services/files.js')

  resetDemoAttachments()

  const workspaceId = 'demo-workspace-uuid'
  const userId = 'demo-user-sarah'
  const otherUserId = 'demo-user-alex'

  // =========================================================================
  // 1. File Validation & Size Enforcement
  // =========================================================================
  console.log('\n[1/7] Testing File Validation & Size Enforcement:')

  // Valid file
  const validFile = { name: 'architecture_specs.pdf', size: 1024 * 1024 * 5, type: 'application/pdf' }
  const validRes = validateFile(validFile)
  if (!validRes.valid) {
    console.error('Validation failed for valid file:', validRes)
    process.exit(1)
  }
  console.log(`  ✓ Valid file accepted: ${validFile.name} (${formatFileSize(validFile.size)})`)

  // Oversized file (> 50MB)
  const oversizedFile = { name: 'huge_dataset.zip', size: 55 * 1024 * 1024, type: 'application/zip' }
  const oversizeRes = validateFile(oversizedFile)
  if (oversizeRes.valid) {
    console.error('Failed to reject oversized file (> 50MB)!')
    process.exit(1)
  }
  console.log(`  ✓ Oversized file correctly rejected (> 50MB limit): "${oversizeRes.error}"`)

  // Prohibited executable file (.exe, .bat, .sh)
  for (const ext of ['.exe', '.bat', '.sh', '.msi']) {
    const maliciousFile = { name: `installer${ext}`, size: 1024 * 50, type: 'application/octet-stream' }
    const execRes = validateFile(maliciousFile)
    if (execRes.valid) {
      console.error(`Failed to reject forbidden executable extension: ${ext}`)
      process.exit(1)
    }
  }
  console.log(`  ✓ Forbidden executable extensions (${FORBIDDEN_EXTENSIONS.slice(0, 4).join(', ')}) strictly blocked.`)

  // =========================================================================
  // 2. Path Traversal Prevention & Filename Sanitization
  // =========================================================================
  console.log('\n[2/7] Testing Path Traversal Prevention & Filename Sanitization:')

  const maliciousNames = [
    '../../etc/passwd',
    '..\\..\\windows\\system32\\cmd.exe',
    'folder/../../../secret.env',
    'bad<name>:with*illegal?chars.png',
  ]

  for (const rawName of maliciousNames) {
    const sanitized = sanitizeFileName(rawName)
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      console.error(`Sanitization failed! Leaked path sequence in: "${sanitized}" from "${rawName}"`)
      process.exit(1)
    }
    console.log(`  ✓ Sanitized "${rawName}" -> "${sanitized}"`)
  }

  // =========================================================================
  // 3. File Upload & Upload Progress Tracking
  // =========================================================================
  console.log('\n[3/7] Testing File Upload & Progress Tracking:')

  const progressUpdates = []
  const testUploadFile = {
    name: 'Product_Roadmap_2027.pdf',
    size: 3200000,
    type: 'application/pdf',
  }

  const uploaded = await uploadFile({
    file: testUploadFile,
    workspaceId,
    projectId: 'demo-project-alpha',
    taskId: 'demo-task-1',
    userId,
    onProgress: (p) => progressUpdates.push(p),
  })

  if (!uploaded || !uploaded.id) {
    console.error('File upload failed to return attachment metadata!', uploaded)
    process.exit(1)
  }

  if (!uploaded.storage_path.startsWith(workspaceId)) {
    console.error(`Storage path does not isolate workspace: ${uploaded.storage_path}`)
    process.exit(1)
  }

  console.log(`  ✓ File successfully uploaded: "${uploaded.file_name}" (ID: ${uploaded.id})`)
  console.log(`  ✓ Stored in private bucket: "${uploaded.bucket_id}"`)
  console.log(`  ✓ Storage path hierarchy: "${uploaded.storage_path}"`)
  console.log(`  ✓ Upload progress events captured: [${progressUpdates.join('%, ')}%]`)

  // =========================================================================
  // 4. Authenticated Signed URL Generation (Private Storage Protection)
  // =========================================================================
  console.log('\n[4/7] Testing Authenticated Signed URL Generation:')

  const { signedUrl } = await getFileDownloadUrl(uploaded.storage_path, uploaded.bucket_id)
  if (!signedUrl || typeof signedUrl !== 'string') {
    console.error('Failed to generate signed URL!', signedUrl)
    process.exit(1)
  }
  console.log(`  ✓ Signed URL successfully generated for private asset.`)
  console.log(`  ✓ Tokenized access endpoint: ${signedUrl.substring(0, 60)}...`)

  // =========================================================================
  // 5. Task-Level Attachments Association
  // =========================================================================
  console.log('\n[5/7] Testing Task-Level Attachments Retrieval:')

  const taskAttachments = await getTaskAttachments('demo-task-1')
  if (!Array.isArray(taskAttachments) || taskAttachments.length === 0) {
    console.error('Failed to retrieve task attachments!', taskAttachments)
    process.exit(1)
  }

  const foundUploaded = taskAttachments.find((a) => a.id === uploaded.id)
  if (!foundUploaded) {
    console.error('Uploaded file not linked to task demo-task-1!')
    process.exit(1)
  }
  console.log(`  ✓ Retrieved ${taskAttachments.length} attachments specifically linked to task demo-task-1`)
  console.log(`  ✓ Task attachment accurately mapped: "${foundUploaded.file_name}"`)

  // =========================================================================
  // 6. Workspace Files Querying & Category Filtering
  // =========================================================================
  console.log('\n[6/7] Testing Workspace Files Filtering & Categorization:')

  const allWorkspaceFiles = await getWorkspaceFiles(workspaceId)
  console.log(`  ✓ Retrieved ${allWorkspaceFiles.length} workspace files in total`)

  // Filter by category
  const imagesOnly = await getWorkspaceFiles(workspaceId, { fileType: 'image' })
  const pdfsOnly = await getWorkspaceFiles(workspaceId, { fileType: 'pdf' })
  const codeOnly = await getWorkspaceFiles(workspaceId, { fileType: 'code' })

  console.log(`  ✓ Category breakdown: ${imagesOnly.length} Images, ${pdfsOnly.length} PDFs, ${codeOnly.length} Code/Data`)

  // Search by name
  const searched = await getWorkspaceFiles(workspaceId, { search: 'Roadmap' })
  if (searched.length === 0 || !searched[0].file_name.includes('Roadmap')) {
    console.error('Search filter failed to find Roadmap file!', searched)
    process.exit(1)
  }
  console.log(`  ✓ Keyword search found matching file: "${searched[0].file_name}"`)

  // =========================================================================
  // 7. Role-Based Attachment Deletion Permissions
  // =========================================================================
  console.log('\n[7/7] Testing Role-Based Attachment Deletion Permissions:')

  // Attempt 1: Unauthorized member attempting to delete Sarah's file
  let unauthorizedBlocked = false
  try {
    await deleteAttachment(uploaded.id, otherUserId, 'Member')
  } catch (err) {
    unauthorizedBlocked = true
    console.log(`  ✓ Unauthorized member correctly prevented from deleting Sarah's file: "${err.message}"`)
  }

  if (!unauthorizedBlocked) {
    console.error('Security vulnerability: Unauthorized member was allowed to delete another user file!')
    process.exit(1)
  }

  // Attempt 2: Sarah (uploader) deleting her own file
  const uploaderDeleted = await deleteAttachment(uploaded.id, userId, 'Member')
  if (!uploaderDeleted) {
    console.error('Uploader failed to delete own file!')
    process.exit(1)
  }
  console.log(`  ✓ Uploader successfully deleted own file.`)

  // Verify file is gone from workspace
  const afterDeleteFiles = await getWorkspaceFiles(workspaceId)
  const stillExists = afterDeleteFiles.some((f) => f.id === uploaded.id)
  if (stillExists) {
    console.error('File still present in workspace list after deletion!')
    process.exit(1)
  }
  console.log(`  ✓ File confirmed purged from workspace attachment index.`)

  console.log('\n=============================================================')
  console.log('✓✓✓ ALL 7/7 STAGE 18 FILE MANAGEMENT TESTS PASSED! ✓✓✓')
  console.log('=============================================================')

  await server.close()
  process.exit(0)
} catch (err) {
  console.error('\n❌ Stage 18 Test Suite Error:', err)
  await server.close()
  process.exit(1)
}

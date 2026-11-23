// ==============================================================================
// CollabSpace Service: File Management & Private Storage
// File: src/services/files.js
// Description:
//   Handles authenticated file uploads, downloads via secure signed URLs,
//   file metadata persistence in public.attachments, file type validation,
//   path traversal prevention, and role-based attachment deletion.
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase'
import { consumeRateLimit, RATE_LIMIT_PRESETS } from '@/utils/rateLimiter'

/**
 * Default maximum file size limit: 50 MB
 */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

/**
 * Forbidden executable file extensions for security
 */
export const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.vbs',
  '.scr',
  '.msi',
  '.ps1',
  '.dll',
  '.com',
  '.jar',
  '.pif',
  '.application',
]

/**
 * Demo files for offline testing and preview environments
 */
export const DEMO_FILES = [
  {
    id: 'demo-file-1',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-alpha',
    task_id: 'demo-task-1',
    file_name: 'Architecture_Blueprint_v2.png',
    file_size: 2450000, // 2.45 MB
    mime_type: 'image/png',
    storage_path: 'demo-workspace-uuid/projects/demo-project-alpha/arch_v2.png',
    bucket_id: 'workspace-files',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    uploader: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Connor',
      email: 'sarah@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-alpha',
      name: 'Project Alpha',
      color: '#6366f1',
    },
    preview_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'demo-file-2',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-alpha',
    task_id: 'demo-task-2',
    file_name: 'API_Specification_v2.4.pdf',
    file_size: 4890000, // 4.89 MB
    mime_type: 'application/pdf',
    storage_path: 'demo-workspace-uuid/projects/demo-project-alpha/api_spec_v2.4.pdf',
    bucket_id: 'workspace-files',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    uploader: {
      id: 'demo-user-alex',
      full_name: 'Alex Rivera',
      email: 'alex@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-alpha',
      name: 'Project Alpha',
      color: '#6366f1',
    },
    preview_url: null,
  },
  {
    id: 'demo-file-3',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-beta',
    task_id: null,
    file_name: 'Design_System_Tokens.json',
    file_size: 45200, // 45.2 KB
    mime_type: 'application/json',
    storage_path: 'demo-workspace-uuid/general/tokens.json',
    bucket_id: 'workspace-files',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    uploader: {
      id: 'demo-user-elena',
      full_name: 'Elena Rostova',
      email: 'elena@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-beta',
      name: 'Mobile App Redesign',
      color: '#06b6d4',
    },
    preview_url: null,
  },
  {
    id: 'demo-file-4',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-beta',
    task_id: 'demo-task-3',
    file_name: 'Sprint_Burndown_Q4.xlsx',
    file_size: 1120000, // 1.12 MB
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    storage_path: 'demo-workspace-uuid/projects/demo-project-beta/sprint_q4.xlsx',
    bucket_id: 'workspace-files',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    uploader: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Connor',
      email: 'sarah@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-beta',
      name: 'Mobile App Redesign',
      color: '#06b6d4',
    },
    preview_url: null,
  },
]

// In-memory store for demo session uploads
let demoAttachmentsStore = [...DEMO_FILES]

/**
 * Format raw bytes into human-readable size string.
 * @param {number} bytes
 * @returns {string} e.g. "12.4 MB"
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(1))
  return `${formatted} ${sizes[i]}`
}

/**
 * Categorize a file by MIME type or file extension.
 * @param {string} mimeType
 * @param {string} fileName
 * @returns {'image' | 'pdf' | 'document' | 'spreadsheet' | 'code' | 'archive' | 'media' | 'other'}
 */
export function getFileTypeCategory(mimeType = '', fileName = '') {
  const mime = (mimeType || '').toLowerCase()
  const ext = (fileName.split('.').pop() || '').toLowerCase()

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return 'image'
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf'
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xls', 'xlsx', 'csv', 'numbers'].includes(ext)
  ) {
    return 'spreadsheet'
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    ['doc', 'docx', 'odt', 'rtf', 'pages'].includes(ext)
  ) {
    return 'document'
  }
  if (
    mime.startsWith('text/') ||
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('xml') ||
    ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'sql', 'md', 'env', 'sh', 'yml', 'yaml'].includes(ext)
  ) {
    return 'code'
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archive'
  }
  if (mime.startsWith('video/') || mime.startsWith('audio/') || ['mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg'].includes(ext)) {
    return 'media'
  }
  return 'other'
}

/**
 * Sanitizes a file name to prevent path traversal and unsafe character attacks.
 * Strips '../', leading/trailing slashes, and restricts characters.
 * @param {string} fileName
 * @returns {string} Sanitized file name
 */
export function sanitizeFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return `file_${Date.now()}`
  }

  // Strip null bytes and control chars
  let cleaned = fileName.replace(/[\x00-\x1f\x7f]/g, '')

  // Prevent directory traversal: remove '../', '..\\', './', '.\\'
  cleaned = cleaned.replace(/\.\.+[/\\]/g, '')

  // Take only the basename in case a path was provided
  cleaned = cleaned.split('/').pop().split('\\').pop()

  // Replace disallowed characters with underscore
  cleaned = cleaned.replace(/[/\\?%*:|"<>]/g, '_')

  // Trim whitespace and leading dots
  cleaned = cleaned.trim().replace(/^\.+/, '')

  // Limit length
  if (cleaned.length > 150) {
    const ext = cleaned.split('.').pop()
    const nameWithoutExt = cleaned.substring(0, cleaned.lastIndexOf('.'))
    cleaned = `${nameWithoutExt.substring(0, 140)}.${ext}`
  }

  return cleaned || `upload_${Date.now()}`
}

/**
 * Validates a file for upload against security limits and forbidden types.
 * @param {File|object} file
 * @param {object} [options]
 * @param {number} [options.maxSizeBytes=MAX_FILE_SIZE_BYTES]
 * @param {Array<string>} [options.allowedTypes]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, options = {}) {
  if (!file) {
    return { valid: false, error: 'No file selected for upload.' }
  }

  const maxBytes = options.maxSizeBytes || MAX_FILE_SIZE_BYTES
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of ${formatFileSize(maxBytes)} (File is ${formatFileSize(file.size)}).`,
    }
  }

  // Check forbidden executable extensions
  const name = file.name || ''
  const lowerName = name.toLowerCase()
  for (const ext of FORBIDDEN_EXTENSIONS) {
    if (lowerName.endsWith(ext)) {
      return {
        valid: false,
        error: `Executable file types (${ext}) are strictly prohibited for security.`,
      }
    }
  }

  // Check path traversal in filename
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid file name. Path traversal characters (e.g. "../") are not allowed.',
    }
  }

  // Check allowedTypes if provided
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const fileType = file.type || ''
    const ext = name.split('.').pop()?.toLowerCase() || ''
    const matches = options.allowedTypes.some((pattern) => {
      if (pattern.startsWith('.')) {
        return ext === pattern.replace('.', '').toLowerCase()
      }
      if (pattern.endsWith('/*')) {
        return fileType.startsWith(pattern.replace('/*', ''))
      }
      return fileType === pattern
    })

    if (!matches) {
      return {
        valid: false,
        error: `File type not supported. Allowed formats: ${options.allowedTypes.join(', ')}.`,
      }
    }
  }

  return { valid: true }
}

/**
 * Uploads a file to Supabase Storage (private bucket 'workspace-files')
 * and stores its metadata in public.attachments.
 *
 * @param {object} params
 * @param {File} params.file Browser File object
 * @param {string} params.workspaceId Workspace UUID
 * @param {string} [params.projectId] Optional Project UUID
 * @param {string} [params.taskId] Optional Task UUID
 * @param {string} [params.documentId] Optional Document UUID
 * @param {string} params.userId Current authenticated user UUID
 * @param {string} [params.bucketId='workspace-files'] Target private storage bucket
 * @param {Function} [params.onProgress] Optional progress callback (percent: number)
 * @returns {Promise<object>} Uploaded attachment object
 */
export async function uploadFile({
  file,
  workspaceId,
  projectId = null,
  taskId = null,
  documentId = null,
  userId,
  bucketId = 'workspace-files',
  onProgress = null,
}) {
  if (!workspaceId) {
    throw new Error('Workspace ID is required for file uploads.')
  }

  // Rate limiting check
  consumeRateLimit(`upload:${workspaceId}`, RATE_LIMIT_PRESETS.FILE_UPLOAD)

  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const sanitizedName = sanitizeFileName(file.name)
  const uniqueToken = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const uniqueFileName = `${uniqueToken}_${sanitizedName}`

  // Deterministic, secure path hierarchy: <workspace_id>/<category>/<uniqueFileName>
  let folderCategory = 'general'
  if (taskId) {
    folderCategory = `tasks/${taskId}`
  } else if (projectId) {
    folderCategory = `projects/${projectId}`
  }
  const storagePath = `${workspaceId}/${folderCategory}/${uniqueFileName}`

  // Notify initial progress
  if (onProgress) onProgress(10)

  // Demo / Offline fallback mode
  if (!isSupabaseConfigured || workspaceId.startsWith('demo-') || userId?.startsWith('demo-') || userId?.startsWith('test-')) {
    if (onProgress) {
      onProgress(50)
      onProgress(100)
    }

    let previewUrl = null
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        previewUrl = URL.createObjectURL(file)
      } catch {
        previewUrl = null
      }
    }

    const newAttachment = {
      id: `demo-att-${Date.now()}`,
      workspace_id: workspaceId,
      project_id: projectId || null,
      task_id: taskId || null,
      document_id: documentId || null,
      uploader_id: userId || 'demo-user-sarah',
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      storage_path: storagePath,
      bucket_id: bucketId,
      created_at: new Date().toISOString(),
      uploader: {
        id: userId || 'demo-user-sarah',
        full_name: 'Current User',
        email: 'user@collabspace.app',
        avatar_url: '',
      },
      preview_url: previewUrl,
    }

    demoAttachmentsStore.unshift(newAttachment)
    return newAttachment
  }

  try {
    // 1. Upload file binary into private Supabase Storage
    if (onProgress) onProgress(40)

    const { data: storageData, error: storageError } = await supabase.storage
      .from(bucketId)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false, // Prevent unauthorized file replacement
      })

    if (storageError) {
      console.error('Supabase Storage upload error:', storageError)
      throw new Error(`Storage upload failed: ${storageError.message}`)
    }

    if (onProgress) onProgress(80)

    // 2. Persist file metadata in public.attachments
    const { data: attachmentRecord, error: dbError } = await supabase
      .from('attachments')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId || null,
        task_id: taskId || null,
        document_id: documentId || null,
        uploader_id: userId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        storage_path: storageData.path || storagePath,
        bucket_id: bucketId,
      })
      .select(`
        *,
        uploader:uploader_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        project:project_id (
          id,
          name,
          color
        )
      `)
      .single()

    if (dbError) {
      console.error('Failed to create attachment record:', dbError)
      // Cleanup uploaded storage file if DB insert fails
      await supabase.storage.from(bucketId).remove([storagePath]).catch(() => {})
      throw new Error(`Database record creation failed: ${dbError.message}`)
    }

    if (onProgress) onProgress(100)
    return attachmentRecord
  } catch (err) {
    console.error('uploadFile service error:', err)
    throw err
  }
}

/**
 * Generates an expiring signed URL for secure, authenticated access to a private file.
 *
 * @param {string} storagePath File path in storage bucket
 * @param {string} [bucketId='workspace-files']
 * @param {number} [expiresIn=3600] Time in seconds before URL expires (default 1 hour)
 * @returns {Promise<{ signedUrl: string }>}
 */
export async function getFileDownloadUrl(storagePath, bucketId = 'workspace-files', expiresIn = 3600) {
  if (!storagePath) {
    throw new Error('Storage path is required to generate download URL.')
  }

  if (!isSupabaseConfigured || storagePath.startsWith('demo-')) {
    // Return mock preview or blob url
    const found = demoAttachmentsStore.find((a) => a.storage_path === storagePath)
    return {
      signedUrl: found?.preview_url || `https://collabspace.app/mock-storage/${encodeURIComponent(storagePath)}`,
    }
  }

  const { data, error } = await supabase.storage
    .from(bucketId)
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    console.error('Failed to create signed URL:', error)
    throw new Error(`Failed to generate secure URL: ${error.message}`)
  }

  return { signedUrl: data.signedUrl }
}

/**
 * Downloads a file directly using the authenticated session.
 * Creates a browser download trigger for the user.
 *
 * @param {object} params
 * @param {string} params.storagePath
 * @param {string} params.fileName
 * @param {string} [params.bucketId='workspace-files']
 */
export async function downloadFile({ storagePath, fileName, bucketId = 'workspace-files' }) {
  if (!storagePath) throw new Error('Storage path is required.')

  if (!isSupabaseConfigured || storagePath.startsWith('demo-')) {
    const link = document.createElement('a')
    link.href = '#'
    link.download = fileName || 'download'
    link.click()
    return
  }

  const { data, error } = await supabase.storage
    .from(bucketId)
    .download(storagePath)

  if (error) {
    console.error('Error downloading file blob:', error)
    throw new Error(`Download failed: ${error.message}`)
  }

  // Create temporary blob URL and trigger download
  const blobUrl = window.URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(blobUrl)
}

/**
 * Retrieves attachments for a workspace with optional filters.
 *
 * @param {string} workspaceId
 * @param {object} [options]
 * @param {string} [options.projectId]
 * @param {string} [options.taskId]
 * @param {string} [options.search]
 * @param {string} [options.fileType] 'all' | 'image' | 'pdf' | 'document' | 'spreadsheet' | 'code' | 'archive'
 * @param {number} [options.limit=100]
 * @returns {Promise<Array<object>>} List of attachments
 */
export async function getWorkspaceFiles(workspaceId, options = {}) {
  const { projectId, taskId, search, fileType = 'all', limit = 100 } = options

  if (!workspaceId) return []

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    let results = demoAttachmentsStore.filter((f) => f.workspace_id === workspaceId)

    if (projectId) {
      results = results.filter((f) => f.project_id === projectId)
    }
    if (taskId) {
      results = results.filter((f) => f.task_id === taskId)
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim()
      results = results.filter((f) => f.file_name.toLowerCase().includes(q))
    }
    if (fileType && fileType !== 'all') {
      results = results.filter((f) => getFileTypeCategory(f.mime_type, f.file_name) === fileType)
    }

    return results
  }

  try {
    let query = supabase
      .from('attachments')
      .select(`
        *,
        uploader:uploader_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        project:project_id (
          id,
          name,
          color
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    if (taskId) {
      query = query.eq('task_id', taskId)
    }
    if (search && search.trim()) {
      query = query.ilike('file_name', `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching workspace files:', error)
      throw error
    }

    let files = data || []
    if (fileType && fileType !== 'all') {
      files = files.filter((f) => getFileTypeCategory(f.mime_type, f.file_name) === fileType)
    }

    return files
  } catch (err) {
    console.error('getWorkspaceFiles failed:', err)
    return []
  }
}

/**
 * Retrieves all attachments associated with a specific task.
 *
 * @param {string} taskId
 * @returns {Promise<Array<object>>}
 */
export async function getTaskAttachments(taskId) {
  if (!taskId) return []

  if (!isSupabaseConfigured || taskId.startsWith('demo-')) {
    return demoAttachmentsStore.filter((f) => f.task_id === taskId)
  }

  const { data, error } = await supabase
    .from('attachments')
    .select(`
      *,
      uploader:uploader_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching task attachments:', error)
    return []
  }

  return data || []
}

/**
 * Deletes an attachment record and removes the file from private Supabase Storage.
 *
 * @param {string} attachmentId Attachment UUID
 * @param {string} userId Current user UUID
 * @param {string} userRole Role in workspace ('Owner' | 'Admin' | 'Member' etc.)
 * @param {string} [bucketId='workspace-files']
 * @returns {Promise<boolean>}
 */
export async function deleteAttachment(attachmentId, userId, userRole = 'Member', bucketId = 'workspace-files') {
  if (!attachmentId) throw new Error('Attachment ID is required.')

  if (!isSupabaseConfigured || attachmentId.startsWith('demo-')) {
    const found = demoAttachmentsStore.find((f) => f.id === attachmentId)
    if (!found) {
      throw new Error('Attachment not found.')
    }
    const isUploader = found.uploader_id === userId
    const isPrivileged = ['Owner', 'Admin'].includes(userRole)

    if (!isUploader && !isPrivileged) {
      throw new Error('Permission denied: You can only delete your own attachments unless you are a workspace Admin.')
    }

    demoAttachmentsStore = demoAttachmentsStore.filter((f) => f.id !== attachmentId)
    return true
  }

  // 1. Fetch attachment details to check permissions & storage path
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('id, uploader_id, storage_path, bucket_id')
    .eq('id', attachmentId)
    .single()

  if (fetchError || !attachment) {
    throw new Error('Attachment not found.')
  }

  const isUploader = attachment.uploader_id === userId
  const isPrivileged = ['Owner', 'Admin'].includes(userRole)

  if (!isUploader && !isPrivileged) {
    throw new Error('Permission denied: You can only delete your own attachments unless you are a workspace Admin.')
  }

  // 2. Remove file from private storage bucket
  const targetBucket = attachment.bucket_id || bucketId
  if (attachment.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(targetBucket)
      .remove([attachment.storage_path])

    if (storageError) {
      console.warn('Warning: Storage file deletion failed:', storageError)
    }
  }

  // 3. Delete database record
  const { error: dbError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId)

  if (dbError) {
    console.error('Error deleting attachment record:', dbError)
    throw new Error(`Failed to delete attachment: ${dbError.message}`)
  }

  return true
}

/**
 * Resets demo store for unit testing
 */
export function resetDemoAttachments() {
  demoAttachmentsStore = [...DEMO_FILES]
}

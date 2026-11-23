// ==============================================================================
// CollabSpace Page: FileManagerPage
// File: src/pages/FileManagerPage.jsx
// Description:
//   Dedicated file manager workspace for browsing, previewing, uploading,
//   and organizing files stored in private Supabase Storage buckets.
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  FolderOpen,
  UploadCloud,
  Search,
  Filter,
  Grid,
  List,
  File,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  FileCard,
  FileList,
  FilePreviewModal,
  FileUploadDropzone,
} from '@/components/file'
import {
  getWorkspaceFiles,
  deleteAttachment,
  formatFileSize,
  MAX_FILE_SIZE_BYTES,
} from '@/services/files'
import { getWorkspaceProjects } from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

export function FileManagerPage() {
  const { user } = useAuth()
  const { currentWorkspace, role } = useWorkspace()

  const [files, setFiles] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)

  const workspaceId = currentWorkspace?.id || null

  // Load projects for workspace to populate filter dropdown
  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getWorkspaceProjects(workspaceId)
        setProjects(data || [])
      } catch (err) {
        console.error('Failed to load projects:', err)
      }
    }
    if (workspaceId) {
      loadProjects()
    } else {
      setProjects([])
    }
  }, [workspaceId])

  // Fetch files with active filters
  const loadFiles = useCallback(async (isRefresh = false) => {
    if (!workspaceId) {
      setFiles([])
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const data = await getWorkspaceFiles(workspaceId, {
        projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
        fileType: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery,
      })
      setFiles(data || [])
    } catch (err) {
      console.error('Failed to load workspace files:', err)
      toast.error('Failed to load files from storage')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [workspaceId, selectedProjectId, selectedCategory, searchQuery])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Handle file deletion
  const handleDeleteFile = async (attachmentId) => {
    try {
      await deleteAttachment(attachmentId, user?.id, role)
      setFiles((prev) => prev.filter((f) => f.id !== attachmentId))
      if (previewAttachment?.id === attachmentId) {
        setPreviewAttachment(null)
      }
      toast.success('File deleted successfully')
    } catch (err) {
      console.error('File deletion error:', err)
      toast.error(err.message || 'Failed to delete file')
    }
  }

  // Calculate storage metrics
  const totalSizeBytes = files.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0)
  const totalStorageLimitBytes = 50 * 1024 * 1024 // 50MB per workspace
  const storagePercent = Math.min(Math.round((totalSizeBytes / totalStorageLimitBytes) * 100), 100)

  const categoryPills = [
    { id: 'all', label: 'All Files', icon: FolderOpen },
    { id: 'image', label: 'Images', icon: ImageIcon },
    { id: 'pdf', label: 'PDFs', icon: FileText },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'spreadsheet', label: 'Spreadsheets', icon: FileSpreadsheet },
    { id: 'code', label: 'Code & Data', icon: FileCode },
    { id: 'archive', label: 'Archives', icon: FileArchive },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FolderOpen className="h-6 w-6 text-brand" />
            File Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Store, preview, and securely share workspace files via encrypted private storage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFiles(true)}
            disabled={isRefreshing || isLoading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="brand"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Storage Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Files */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Files</span>
            <HardDrive className="h-4 w-4 text-brand" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{files.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Across tasks, projects, and general storage
          </p>
        </div>

        {/* Space Consumed */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Workspace Storage Used</span>
            <span className="font-mono">{formatFileSize(totalSizeBytes)}</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(storagePercent, 2)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>{storagePercent}% of 50 MB limit</span>
            <span>Max 50 MB/file</span>
          </p>
        </div>

        {/* Security Info */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Access Control & Security</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-foreground">Private Supabase Bucket</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Enforced with RLS & time-limited signed URLs. Never publicly exposed.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        {/* Search & Project Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs"
            />
          </div>

          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-9 text-xs min-w-[160px]"
            options={[
              { value: 'all', label: 'All Projects' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs transition-colors ${
              viewMode === 'grid'
                ? 'bg-secondary text-foreground font-medium shadow-2xs'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-xs transition-colors ${
              viewMode === 'list'
                ? 'bg-secondary text-foreground font-medium shadow-2xs'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categoryPills.map((pill) => {
          const Icon = pill.icon
          const isActive = selectedCategory === pill.id
          return (
            <button
              key={pill.id}
              onClick={() => setSelectedCategory(pill.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shrink-0 font-medium ${
                isActive
                  ? 'bg-brand text-white border-brand shadow-2xs'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{pill.label}</span>
            </button>
          )
        })}
      </div>

      {/* Files Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={searchQuery ? 'No files match your search' : 'No files uploaded yet'}
          description={
            searchQuery
              ? `No files found matching "${searchQuery}". Try adjusting your keywords or filters.`
              : 'Share files, design assets, specs, and documents securely with your team.'
          }
          actionLabel="Upload First File"
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <FileCard
              key={file.id}
              attachment={file}
              onPreview={(item) => setPreviewAttachment(item)}
              onDelete={handleDeleteFile}
              canDelete={
                file.uploader_id === user?.id || ['Owner', 'Admin'].includes(role)
              }
            />
          ))}
        </div>
      ) : (
        <FileList
          attachments={files}
          onPreview={(item) => setPreviewAttachment(item)}
          onDelete={handleDeleteFile}
          currentUserId={user?.id}
          userRole={role}
        />
      )}

      {/* Upload File Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Files to Workspace"
        description="Uploaded files are stored privately and encrypted with authenticated access control."
        size="lg"
      >
        <div className="space-y-4">
          <FileUploadDropzone
            workspaceId={workspaceId}
            projectId={selectedProjectId !== 'all' ? selectedProjectId : null}
            userId={user?.id}
            onUploadSuccess={(newFile) => {
              setFiles((prev) => [newFile, ...prev])
              toast.success(`Uploaded ${newFile.file_name}`)
            }}
            onUploadError={(err) => {
              toast.error(err || 'Failed to upload')
            }}
          />

          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* File Preview Modal */}
      {previewAttachment && (
        <FilePreviewModal
          isOpen={Boolean(previewAttachment)}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
          canDelete={
            previewAttachment.uploader_id === user?.id || ['Owner', 'Admin'].includes(role)
          }
          onDelete={handleDeleteFile}
        />
      )}
    </div>
  )
}

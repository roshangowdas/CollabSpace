// ==============================================================================
// CollabSpace Component: CreateDocumentModal
// File: src/components/document/CreateDocumentModal.jsx
// Description:
//   Modal to create a new collaborative document with title, project selection,
//   and starter template content.
// ==============================================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  FolderKanban,
  FileCode,
  Users,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { createDocument } from '@/services/documents'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

const TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank Document',
    description: 'Empty page ready for writing specifications or notes',
    icon: FileText,
  },
  {
    id: 'prd',
    title: 'Product Requirements (PRD)',
    description: 'Structured layout with Objectives, User Stories, and Milestones',
    icon: FolderKanban,
  },
  {
    id: 'meeting',
    title: 'Meeting Notes & Agenda',
    description: 'Attendees, discussion topics, and assigned action items',
    icon: Users,
  },
]

export function CreateDocumentModal({
  isOpen,
  onClose,
  projects = [],
  onDocumentCreated = null,
}) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('blank')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const getTemplateContent = (templateId, docTitle) => {
    if (templateId === 'prd') {
      return {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: docTitle || 'Product Requirements Document' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '1. Executive Summary & Goals' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Detail the primary problem statement and expected business outcomes.' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '2. User Personas & Scenarios' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Primary user persona requirements.' }] }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '3. Technical Acceptance Criteria' }],
          },
          {
            type: 'blockquote',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'All criteria must pass CI verification before shipping.' }] }],
          },
        ],
      }
    }

    if (templateId === 'meeting') {
      return {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: docTitle || 'Team Meeting Notes' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: `Date: ${new Date().toLocaleDateString()}` }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Agenda Items' }],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sprint progress review.' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Architecture roadblocks and blockers.' }] }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Action Items' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sarah: Complete pull request review.' }] }],
              },
            ],
          },
        ],
      }
    }

    // Default Blank
    return {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: docTitle || 'Untitled Document' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Start writing your document collaboratively...' }],
        },
      ],
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Document title is required.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const templateContent = getTemplateContent(selectedTemplate, trimmedTitle)
      const newDoc = await createDocument({
        workspaceId: currentWorkspace?.id || 'demo-workspace-uuid',
        projectId: selectedProjectId || null,
        title: trimmedTitle,
        content: templateContent,
        contentText: `${trimmedTitle} ...`,
        userId: user?.id,
      })

      toast.success(`Created document "${trimmedTitle}"`)
      if (onDocumentCreated) onDocumentCreated(newDoc)
      onClose()
      navigate(`/docs/${newDoc.id}`)
    } catch (err) {
      console.error('Failed to create document:', err)
      setError(err.message || 'Failed to create document')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Collaborative Document"
      description="Collaborate in real-time with team members using live CRDT synchronization."
      size="default"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="doc-title">Document Title</Label>
          <Input
            id="doc-title"
            placeholder="e.g. Sprint Architecture & API RFC"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc-project">Associated Project (Optional)</Label>
          <Select
            id="doc-project"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={[
              { value: '', label: 'None (Workspace General Document)' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label>Select Template</Label>
          <div className="grid grid-cols-1 gap-2">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon
              const isSelected = selectedTemplate === tpl.id
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand bg-brand/5 shadow-2xs'
                      : 'border-border hover:border-brand/40 hover:bg-muted/30 bg-card'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-brand text-white' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{tpl.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Creating...
              </>
            ) : (
              'Create & Open'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

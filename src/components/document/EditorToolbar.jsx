// ==============================================================================
// CollabSpace Component: EditorToolbar
// File: src/components/document/EditorToolbar.jsx
// Description:
//   Rich-text formatting toolbar for Tiptap editor with headings, bold, italic,
//   underline, lists, links, blockquotes, and Yjs undo/redo actions.
// ==============================================================================

import React, { useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@/utils/cn'

export function EditorToolbar({ editor, className = '' }) {
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  if (!editor) return null

  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run()
    } else {
      let finalUrl = linkUrl.trim()
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`
      }
      editor.chain().focus().setLink({ href: finalUrl }).run()
    }
    setLinkInputOpen(false)
    setLinkUrl('')
  }

  const toggleLinkModal = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
    } else {
      const prevUrl = editor.getAttributes('link').href || ''
      setLinkUrl(prevUrl)
      setLinkInputOpen(true)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center gap-1 p-1.5 border-b border-border bg-muted/30 backdrop-blur-xs select-none',
        className
      )}
    >
      {/* Undo & Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          'p-1.5 rounded transition-colors text-xs font-bold px-2',
          editor.isActive('heading', { level: 1 })
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Heading 1"
      >
        H1
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          'p-1.5 rounded transition-colors text-xs font-bold px-2',
          editor.isActive('heading', { level: 2 })
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Heading 2"
      >
        H2
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          'p-1.5 rounded transition-colors text-xs font-bold px-2',
          editor.isActive('heading', { level: 3 })
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Heading 3"
      >
        H3
      </button>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Text Styles: Bold, Italic, Underline */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'p-1.5 rounded transition-colors',
          editor.isActive('bold')
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'p-1.5 rounded transition-colors',
          editor.isActive('italic')
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          'p-1.5 rounded transition-colors',
          editor.isActive('underline')
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'p-1.5 rounded transition-colors',
          editor.isActive('bulletList')
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'p-1.5 rounded transition-colors',
          editor.isActive('orderedList')
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          'p-1.5 rounded transition-colors',
          editor.isActive('blockquote')
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Link */}
      <button
        type="button"
        onClick={toggleLinkModal}
        className={cn(
          'p-1.5 rounded transition-colors',
          editor.isActive('link')
            ? 'bg-brand/15 text-brand border border-brand/30'
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        )}
        title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
      >
        {editor.isActive('link') ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      </button>

      {/* Floating Mini Link Input */}
      {linkInputOpen && (
        <div className="absolute top-full left-10 mt-1 z-30 flex items-center gap-1.5 p-2 bg-card rounded-lg border border-border shadow-modal">
          <input
            type="text"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetLink()}
            className="px-2.5 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-brand w-56"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSetLink}
            className="px-2.5 py-1 text-xs bg-brand text-white rounded-md font-medium hover:bg-brand/90 transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setLinkInputOpen(false)}
            className="px-2 py-1 text-xs text-muted-foreground hover:bg-secondary rounded-md"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

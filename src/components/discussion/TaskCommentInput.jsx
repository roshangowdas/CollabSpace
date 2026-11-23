import React, { useState, useRef, useEffect } from 'react'
import { Send, AtSign, Loader2, Smile } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'

export function TaskCommentInput({
  onSubmit,
  members = [],
  placeholder = 'Write a comment... (Type @ to mention team members)',
  isSubmitting = false,
  className,
}) {
  const [content, setContent] = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionPosition, setMentionPosition] = useState(0)
  const textareaRef = useRef(null)

  // Filter members matching mention query
  const matchingMembers = React.useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return members.filter((m) => {
      const u = m.profile || m
      const username = u.username?.toLowerCase() || ''
      const name = (u.full_name || u.name || '').toLowerCase()
      return username.includes(q) || name.includes(q)
    }).slice(0, 5)
  }, [mentionQuery, members])

  const handleTextChange = (e) => {
    const val = e.target.value
    setContent(val)

    // Check if cursor is right after an '@'
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = val.slice(0, cursorPos)
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)

    if (match) {
      setMentionQuery(match[1])
      setMentionPosition(cursorPos)
    } else {
      setMentionQuery(null)
    }
  }

  const handleSelectMention = (member) => {
    const u = member.profile || member
    const username = u.username || 'user'
    const cursorPos = textareaRef.current?.selectionStart || content.length
    const textBefore = content.slice(0, cursorPos)
    const textAfter = content.slice(cursorPos)

    // Replace the '@query' with '@username '
    const updatedBefore = textBefore.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `)
    const newContent = updatedBefore + textAfter

    setContent(newContent)
    setMentionQuery(null)

    // Refocus textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPos = updatedBefore.length
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 10)
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (!content.trim() || isSubmitting) return

    onSubmit(content)
    setContent('')
    setMentionQuery(null)
  }

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn('relative space-y-2', className)}>
      {/* Mention Auto-Suggest Popup */}
      {mentionQuery !== null && matchingMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 z-30 w-64 rounded-lg border border-border bg-popover p-1 shadow-modal overflow-hidden animate-in fade-in-50">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
            Mention Member
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-border/30">
            {matchingMembers.map((member) => {
              const u = member.profile || member
              return (
                <button
                  key={u.id || u.user_id}
                  type="button"
                  onClick={() => handleSelectMention(member)}
                  className="flex w-full items-center gap-2 p-1.5 rounded hover:bg-accent text-left transition-colors cursor-pointer"
                >
                  <Avatar
                    src={u.avatar_url}
                    name={u.full_name || u.username || 'Member'}
                    size="xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {u.full_name || u.username}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      @{u.username || 'user'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Input Box */}
      <div className="rounded-xl border border-border bg-card p-2.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all shadow-subtle">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          disabled={isSubmitting}
          className="w-full resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px]">
              <AtSign className="h-3 w-3 text-brand" />
              <span>Type @ to mention</span>
            </span>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <span className="hidden sm:inline text-[10px]">Ctrl+Enter to send</span>
          </div>

          <Button
            type="button"
            variant="brand"
            size="xs"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            leftIcon={isSubmitting ? Loader2 : Send}
          >
            {isSubmitting ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  )
}


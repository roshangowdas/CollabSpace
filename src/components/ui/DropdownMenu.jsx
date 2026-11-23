import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

export function DropdownMenu({
  trigger,
  children,
  align = 'right',
  className,
  contentClassName,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-flex">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-1.5 min-w-[180px] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-modal outline-none',
              align === 'right' ? 'right-0' : 'left-0',
              contentClassName
            )}
          >
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return child
              return React.cloneElement(child, {
                onClose: () => setIsOpen(false),
              })
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownMenuItem({
  children,
  icon: Icon,
  shortcut,
  destructive = false,
  disabled = false,
  onClick,
  onClose,
  className,
  ...props
}) {
  const handleClick = (e) => {
    if (disabled) return
    if (onClick) onClick(e)
    if (onClose) onClose()
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-xs font-medium outline-none transition-colors duration-100',
        destructive
          ? 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <span className="ml-auto text-[10px] tracking-widest text-muted-foreground opacity-70 font-mono">
          {shortcut}
        </span>
      )}
    </button>
  )
}

export function DropdownMenuSeparator({ className }) {
  return <div className={cn('-mx-1 my-1 h-px bg-border/60', className)} />
}

export function DropdownMenuLabel({ children, className }) {
  return (
    <div
      className={cn(
        'px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none',
        className
      )}
    >
      {children}
    </div>
  )
}


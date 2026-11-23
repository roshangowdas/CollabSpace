import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { KanbanColumn } from './KanbanColumn'
import { KanbanTaskCard } from './KanbanTaskCard'
import {
  calculateTaskPosition,
  moveTaskWithOptimisticUpdate,
} from '@/services/tasks'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { useAuth } from '@/hooks/useAuth'

export const KANBAN_COLUMNS = [
  { id: 'todo', title: 'Todo' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'completed', title: 'Completed' },
]

export function KanbanBoard({
  tasks = [],
  onTasksChange,
  onTaskClick,
  onAddTaskToColumn,
  workspaceId,
}) {
  const { user } = useAuth()
  const [activeTask, setActiveTask] = useState(null)
  const [snapshotTasks, setSnapshotTasks] = useState(null)

  // Configure accessible sensors (Keyboard, Touch, Pointer with distance threshold)
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // 5px movement required to distinguish click from drag
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  })

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  // Subscribe to Supabase Realtime for peer updates
  useEffect(() => {
    if (!isSupabaseConfigured || !workspaceId || workspaceId.startsWith('demo-')) {
      return
    }

    const channelName = `realtime:kanban:${workspaceId}`
    const channel = supabase.channel(channelName)

    channel
      .on('broadcast', { event: 'task_moved' }, ({ payload }) => {
        if (!payload || payload.userId === user?.id) return

        // Update local task state from peer move
        onTasksChange((prevTasks) => {
          return prevTasks.map((t) => {
            if (t.id === payload.taskId) {
              return {
                ...t,
                status: payload.status,
                position: payload.position,
              }
            }
            return t
          })
        })

        toast.info(
          `${payload.userName || 'A teammate'} moved a task to ${payload.status.replace('_', ' ')}.`
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, user?.id, onTasksChange])

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const map = {
      todo: [],
      in_progress: [],
      in_review: [],
      completed: [],
    }

    // Sort tasks by position before grouping
    const sorted = [...tasks].sort((a, b) => (a.position || 0) - (b.position || 0))

    for (const task of sorted) {
      let col = task.status
      if (col === 'done') col = 'completed'
      if (!map[col]) col = 'todo'
      map[col].push(task)
    }

    return map
  }, [tasks])

  // Drag Start: save snapshot for rollback
  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
      setSnapshotTasks([...tasks])
    }
  }

  // Drag Over: local reordering ONLY (zero DB writes during movement per requirements)
  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const activeTaskObj = tasks.find((t) => t.id === activeId)
    if (!activeTaskObj) return

    // Determine target column
    let overColumnId = null
    const isOverAColumn = KANBAN_COLUMNS.some((c) => c.id === overId)
    if (isOverAColumn) {
      overColumnId = overId
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        overColumnId = overTask.status === 'done' ? 'completed' : overTask.status
      }
    }

    if (!overColumnId) return

    const activeColumnId = activeTaskObj.status === 'done' ? 'completed' : activeTaskObj.status

    // If moving across columns, update status locally for smooth visual feedback
    if (activeColumnId !== overColumnId) {
      onTasksChange((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId)
        if (activeIndex === -1) return prev

        const updated = [...prev]
        updated[activeIndex] = {
          ...updated[activeIndex],
          status: overColumnId,
        }
        return updated
      })
    }
  }

  // Drag End: calculate final position & persist to Supabase
  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) {
      setSnapshotTasks(null)
      return
    }

    const activeId = active.id
    const overId = over.id

    const task = tasks.find((t) => t.id === activeId)
    if (!task) return

    // Identify target column
    let targetColumnId = null
    const isColumn = KANBAN_COLUMNS.some((c) => c.id === overId)
    if (isColumn) {
      targetColumnId = overId
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        targetColumnId = overTask.status === 'done' ? 'completed' : overTask.status
      }
    }

    if (!targetColumnId) return

    // Get current tasks in target column (excluding moving task)
    const targetTasks = tasks
      .filter((t) => (t.status === 'done' ? 'completed' : t.status) === targetColumnId && t.id !== activeId)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    // Determine target index within column
    let targetIndex = targetTasks.length
    if (!isColumn) {
      const overIndex = targetTasks.findIndex((t) => t.id === overId)
      if (overIndex !== -1) {
        targetIndex = overIndex
      }
    }

    // Calculate new monotonic position
    const newPosition = calculateTaskPosition(targetTasks, targetIndex)

    // Check if task actually moved
    const prevStatus = snapshotTasks?.find((t) => t.id === activeId)?.status
    const prevPos = snapshotTasks?.find((t) => t.id === activeId)?.position

    if (prevStatus === targetColumnId && Math.abs(prevPos - newPosition) < 0.001) {
      setSnapshotTasks(null)
      return
    }

    // Optimistically update local tasks array
    onTasksChange((prev) => {
      return prev.map((t) => {
        if (t.id === activeId) {
          return {
            ...t,
            status: targetColumnId,
            position: newPosition,
          }
        }
        return t
      })
    })

    // Persist to Supabase
    try {
      await moveTaskWithOptimisticUpdate({
        taskId: activeId,
        newStatus: targetColumnId,
        newPosition,
        workspaceId,
        user,
      })
    } catch (err) {
      console.error('Failed to persist task position:', err)
      // Rollback to previous snapshot
      if (snapshotTasks) {
        onTasksChange(snapshotTasks)
      }
      toast.error('Failed to move task. Previous position restored.')
    } finally {
      setSnapshotTasks(null)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start w-full">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            onTaskClick={onTaskClick}
            onAddTask={onAddTaskToColumn}
          />
        ))}
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <KanbanTaskCard task={activeTask} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}


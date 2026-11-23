// Globals (describe, it, expect, beforeEach) provided by Vitest
import {
  getWorkspaceTasks,
  getTaskById,
  calculateTaskPosition,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '@/services/tasks'
import {
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  extractMentions,
} from '@/services/discussions'

describe('Tasks & Discussions Suite', () => {
  const workspaceId = 'demo-ws-acme-corp'
  const validTaskId = 'demo-task-1'

  describe('Task Statuses & Priorities Configuration', () => {
    it('defines 4 canonical workflow statuses', () => {
      expect(TASK_STATUSES).toBeDefined()
      expect(TASK_STATUSES.TODO).toBe('todo')
      expect(TASK_STATUSES.IN_PROGRESS).toBe('in_progress')
      expect(TASK_STATUSES.IN_REVIEW).toBe('in_review')
      expect(TASK_STATUSES.COMPLETED).toBe('completed')
    })

    it('defines 4 standard priority levels', () => {
      expect(TASK_PRIORITIES).toBeDefined()
      expect(TASK_PRIORITIES.LOW).toBe('low')
      expect(TASK_PRIORITIES.MEDIUM).toBe('medium')
      expect(TASK_PRIORITIES.HIGH).toBe('high')
      expect(TASK_PRIORITIES.URGENT).toBe('urgent')
    })
  })

  describe('Fractional Positioning Reordering Algorithm (Drag & Drop)', () => {
    it('returns default position 1000 for an empty column', () => {
      expect(calculateTaskPosition([], 0)).toBe(1000)
    })

    it('computes top insertion position between 0 and first task', () => {
      const column = [{ id: 't1', position: 1000 }, { id: 't2', position: 2000 }]
      const pos = calculateTaskPosition(column, 0)
      expect(pos).toBe(500)
      expect(pos).toBeLessThan(column[0].position)
    })

    it('computes bottom insertion position higher than last task', () => {
      const column = [{ id: 't1', position: 1000 }, { id: 't2', position: 2000 }]
      const pos = calculateTaskPosition(column, 2)
      expect(pos).toBe(3000)
      expect(pos).toBeGreaterThan(column[1].position)
    })

    it('computes middle insertion between two adjacent positions', () => {
      const column = [{ id: 't1', position: 1000 }, { id: 't2', position: 2000 }]
      const pos = calculateTaskPosition(column, 1)
      expect(pos).toBe(1500)
      expect(pos).toBeGreaterThan(column[0].position)
      expect(pos).toBeLessThan(column[1].position)
    })
  })

  describe('Task Retrieval & ID Tampering Protection', () => {
    it('lists workspace tasks with expected schema', async () => {
      const tasks = await getWorkspaceTasks(workspaceId)
      expect(Array.isArray(tasks)).toBe(true)
      expect(tasks.length).toBeGreaterThan(0)

      const task = tasks[0]
      expect(task).toHaveProperty('id')
      expect(task).toHaveProperty('title')
      expect(task).toHaveProperty('status')
      expect(task).toHaveProperty('priority')
    })

    it('returns null for unknown task ID without fallback leak', async () => {
      const task = await getTaskById('demo-unknown-task-999')
      expect(task).toBeNull()
    })
  })

  describe('Task Comments & Mentions', () => {
    it('extracts @mentions from discussion text', () => {
      const text = 'Hey @alex_rivera and @sarah_j, please review the latest PR.'
      const mentions = extractMentions(text)
      expect(mentions).toContain('alex_rivera')
      expect(mentions).toContain('sarah_j')
      expect(mentions.length).toBe(2)
    })

    it('returns empty array when text has no mentions', () => {
      expect(extractMentions('Regular comment without any tags')).toEqual([])
      expect(extractMentions('')).toEqual([])
    })

    it('retrieves task comments', async () => {
      const comments = await getTaskComments(validTaskId)
      expect(Array.isArray(comments)).toBe(true)
    })
  })
})

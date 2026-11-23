// Globals (describe, it, expect, beforeEach) provided by Vitest
import {
  getWorkspaceProjects,
  getProjectById,
  calculateProjectProgress,
  PROJECT_STATUSES,
} from '@/services/projects'

describe('Projects Management Suite', () => {
  const workspaceId = 'demo-ws-acme-corp'
  const validProjectId = 'demo-proj-collabspace-web'

  describe('Project Progress Calculations', () => {
    it('returns 0% when there are no tasks', () => {
      expect(calculateProjectProgress(0, 0)).toBe(0)
    })

    it('calculates completion rate accurately', () => {
      expect(calculateProjectProgress(10, 5)).toBe(50)
      expect(calculateProjectProgress(3, 1)).toBe(33)
      expect(calculateProjectProgress(4, 4)).toBe(100)
    })

    it('clamps values between 0 and 100', () => {
      expect(calculateProjectProgress(5, 10)).toBe(100)
    })
  })

  describe('Project Listing & Retrieval', () => {
    it('lists workspace projects with expected attributes', async () => {
      const projects = await getWorkspaceProjects(workspaceId)
      expect(Array.isArray(projects)).toBe(true)
      expect(projects.length).toBeGreaterThan(0)

      const first = projects[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('name')
      expect(first).toHaveProperty('key')
      expect(first).toHaveProperty('status')
    })

    it('retrieves project details by valid ID', async () => {
      const project = await getProjectById(validProjectId)
      expect(project).not.toBeNull()
      expect(project.id).toBe(validProjectId)
      expect(project).toHaveProperty('name')
    })

    it('returns null when an unknown or foreign project ID is queried (no fallback leak)', async () => {
      const foreign = await getProjectById('demo-unknown-foreign-project-999')
      expect(foreign).toBeNull()
    })
  })

  describe('Project Status Validation', () => {
    it('defines expected project statuses', () => {
      expect(PROJECT_STATUSES).toBeDefined()
      const keys = Object.keys(PROJECT_STATUSES)
      expect(keys).toContain('PLANNED')
      expect(keys).toContain('IN_PROGRESS')
      expect(keys).toContain('COMPLETED')
    })
  })
})

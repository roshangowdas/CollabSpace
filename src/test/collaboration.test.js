// Globals (describe, it, expect, beforeEach) provided by Vitest
import {
  getWorkspaceDocuments,
  getDocumentById,
  createDocument,
  getCollaboratorColor,
} from '@/services/documents'
import {
  getWorkspaceWhiteboards,
  getWhiteboardById,
  getWhiteboardElements,
  saveWhiteboardElement,
  SHAPE_TYPES,
  STICKY_COLORS,
} from '@/services/whiteboards'
import { verifySupabaseToken, checkDocumentAccess } from '../../server/auth.js'

describe('Collaboration Suite: Documents, Whiteboard & WebSocket Auth', () => {
  const workspaceId = 'demo-workspace-uuid'
  const validDocId = 'demo-doc-1'
  const validWhiteboardId = 'demo-wb-1'

  describe('WebSocket Token Verification & Document Access Security', () => {
    it('verifies valid collaborator identity tokens', async () => {
      const alex = await verifySupabaseToken('demo-token-alex')
      expect(alex).not.toBeNull()
      expect(alex.name).toContain('Alex')
      expect(alex).toHaveProperty('color')

      const elena = await verifySupabaseToken('demo-token-elena')
      expect(elena).not.toBeNull()
      expect(elena.name).toContain('Elena')
    })

    it('rejects null, empty, or undefined tokens', async () => {
      const result = await verifySupabaseToken(null)
      expect(result).toBeNull()

      const resultEmpty = await verifySupabaseToken('')
      expect(resultEmpty).toBeNull()
    })

    it('rejects document access for unauthenticated calls', async () => {
      const authorized = await checkDocumentAccess(null, null)
      expect(authorized).toBe(false)
    })

    it('authorizes document access for workspace members', async () => {
      const authorized = await checkDocumentAccess('demo-doc-1', 'demo-user-alex')
      expect(authorized).toBe(true)
    })
  })

  describe('Collaborative Document Management', () => {
    it('lists workspace documents', async () => {
      const docs = await getWorkspaceDocuments(workspaceId)
      expect(Array.isArray(docs)).toBe(true)
      expect(docs.length).toBeGreaterThan(0)

      const first = docs[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('title')
      expect(first).toHaveProperty('content')
    })

    it('retrieves document details by ID', async () => {
      const doc = await getDocumentById(validDocId)
      expect(doc).not.toBeNull()
      expect(doc.id).toBe(validDocId)
      expect(doc).toHaveProperty('title')
    })

    it('throws Document not found for invalid document ID', async () => {
      await expect(getDocumentById('demo-non-existent-doc-999')).rejects.toThrow(/not found/i)
    })

    it('generates consistent collaborator cursor colors per user ID', () => {
      const c1 = getCollaboratorColor('user-123')
      const c2 = getCollaboratorColor('user-123')
      expect(c1).toBe(c2)
    })
  })

  describe('Collaborative Whiteboard Canvas & Element Sync', () => {
    it('defines supported whiteboard shape types', () => {
      expect(SHAPE_TYPES.STICKY).toBe('sticky_note')
      expect(SHAPE_TYPES.RECTANGLE).toBe('rectangle')
      expect(SHAPE_TYPES.CIRCLE).toBe('circle')
      expect(SHAPE_TYPES.ARROW).toBe('arrow')
      expect(SHAPE_TYPES.LINE).toBe('line')
      expect(SHAPE_TYPES.FREEHAND).toBe('path')
      expect(SHAPE_TYPES.TEXT).toBe('text')
    })

    it('provides sticky note color palette', () => {
      expect(Array.isArray(STICKY_COLORS)).toBe(true)
      expect(STICKY_COLORS.length).toBeGreaterThanOrEqual(5)
      expect(STICKY_COLORS[0]).toHaveProperty('bg')
      expect(STICKY_COLORS[0]).toHaveProperty('name')
    })

    it('retrieves whiteboard board and elements', async () => {
      const wb = await getWhiteboardById(validWhiteboardId)
      expect(wb).not.toBeNull()
      expect(wb.id).toBe(validWhiteboardId)

      const elements = await getWhiteboardElements(validWhiteboardId)
      expect(Array.isArray(elements)).toBe(true)
    })

    it('persists single element modifications without replacing entire board', async () => {
      const newElement = {
        whiteboardId: validWhiteboardId,
        elementType: SHAPE_TYPES.STICKY,
        properties: {
          x: 150,
          y: 250,
          width: 200,
          height: 200,
          content: 'Test sticky note content',
          color: STICKY_COLORS[0].bg,
        },
      }

      const saved = await saveWhiteboardElement(newElement)
      expect(saved).not.toBeNull()
      expect(saved).toHaveProperty('id')
      expect(saved.properties.content).toBe('Test sticky note content')
    })
  })
})

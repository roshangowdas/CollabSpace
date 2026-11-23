// Globals (describe, it, expect, beforeEach) provided by Vitest
import {
  formatFileSize,
  getFileTypeCategory,
  sanitizeFileName,
  validateFile,
  MAX_FILE_SIZE_BYTES,
  FORBIDDEN_EXTENSIONS,
} from '@/services/files'

describe('File Management & Storage Security Suite', () => {
  describe('File Size Formatting & Category Detection', () => {
    it('formats file sizes accurately into human-readable strings', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(2500000)).toBe('2.4 MB')
      expect(formatFileSize(52428800)).toBe('50 MB')
    })

    it('categorizes MIME types and extensions into correct buckets', () => {
      expect(getFileTypeCategory('image/png', 'design.png')).toBe('image')
      expect(getFileTypeCategory('application/pdf', 'spec.pdf')).toBe('pdf')
      expect(getFileTypeCategory('text/javascript', 'index.js')).toBe('code')
      expect(getFileTypeCategory('application/zip', 'archive.zip')).toBe('archive')
      expect(getFileTypeCategory('video/mp4', 'demo.mp4')).toBe('media')
      expect(getFileTypeCategory('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'sheet.xlsx')).toBe('spreadsheet')
      expect(getFileTypeCategory('application/octet-stream', 'unknown.xyz')).toBe('other')
    })
  })

  describe('Security Sanitization & Path Traversal Prevention', () => {
    it('strips directory traversal characters and slashes', () => {
      expect(sanitizeFileName('../../etc/passwd')).not.toContain('..')
      expect(sanitizeFileName('..\\..\\windows\\system32\\cmd.exe')).not.toContain('..')
      expect(sanitizeFileName('folder/nested/image.png')).toBe('image.png')
    })

    it('strips null bytes and unsafe characters', () => {
      const malicious = 'evil\x00file|<>?.png'
      const clean = sanitizeFileName(malicious)
      expect(clean).not.toContain('\x00')
      expect(clean).not.toContain('|')
      expect(clean).not.toContain('<')
      expect(clean).not.toContain('>')
      expect(clean).not.toContain('?')
    })

    it('generates a safe fallback name for empty input', () => {
      expect(sanitizeFileName('')).toMatch(/^file_\d+$/)
      expect(sanitizeFileName(null)).toMatch(/^file_\d+$/)
    })
  })

  describe('Executable Rejection & Upload Security Constraints', () => {
    it('strictly prohibits all dangerous executable extensions', () => {
      for (const ext of FORBIDDEN_EXTENSIONS) {
        const file = { name: `dangerous${ext}`, size: 1024 }
        const result = validateFile(file)
        expect(result.valid).toBe(false)
        expect(result.error).toMatch(/strictly prohibited/i)
      }
    })

    it('rejects files exceeding maximum allowed size limit', () => {
      const hugeFile = { name: 'backup.tar', size: MAX_FILE_SIZE_BYTES + 1000 }
      const result = validateFile(hugeFile)
      expect(result.valid).toBe(false)
      expect(result.error).toMatch(/exceeds maximum allowed size/i)
    })

    it('allows valid documents, images, and archives within size limits', () => {
      const validImage = { name: 'architecture.png', size: 2 * 1024 * 1024 }
      expect(validateFile(validImage).valid).toBe(true)

      const validPdf = { name: 'specs.pdf', size: 5 * 1024 * 1024 }
      expect(validateFile(validPdf).valid).toBe(true)
    })
  })
})

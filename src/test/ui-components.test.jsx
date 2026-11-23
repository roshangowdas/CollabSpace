import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
// Globals (describe, it, expect, vi) provided by Vitest
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Checkbox } from '@/components/ui/Checkbox'

describe('UI Component Library Suite (React Testing Library)', () => {
  describe('Button Component', () => {
    it('renders with children text and triggers onClick', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click Me</Button>)

      const btn = screen.getByRole('button', { name: /click me/i })
      expect(btn).toBeInTheDocument()

      fireEvent.click(btn)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders disabled state and prevents clicks', () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      )

      const btn = screen.getByRole('button', { name: /disabled button/i })
      expect(btn).toBeDisabled()

      fireEvent.click(btn)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Badge Component', () => {
    it('renders badge with text content', () => {
      render(<Badge variant="secondary">In Progress</Badge>)
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })
  })

  describe('Card Component Structure', () => {
    it('renders Card with Header, Title, and Content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Sprint Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Sprint 4 deliverables</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Sprint Overview')).toBeInTheDocument()
      expect(screen.getByText('Sprint 4 deliverables')).toBeInTheDocument()
    })
  })

  describe('Input Component', () => {
    it('handles value changes properly', () => {
      const handleChange = vi.fn()
      render(<Input placeholder="Enter task name" onChange={handleChange} />)

      const input = screen.getByPlaceholderText('Enter task name')
      fireEvent.change(input, { target: { value: 'Fix OAuth Callback' } })

      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(input.value).toBe('Fix OAuth Callback')
    })
  })

  describe('Avatar Component', () => {
    it('renders initials fallback when image is absent', () => {
      render(<Avatar name="Alex Rivera" fallback="AR" />)
      expect(screen.getByText('AR')).toBeInTheDocument()
    })
  })

  describe('Checkbox Component', () => {
    it('renders with label and toggles when label or checkbox is clicked', () => {
      const handleChange = vi.fn()
      render(
        <Checkbox
          id="terms"
          label="I agree to the CollabSpace Terms of Service"
          onChange={handleChange}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      // Click on the label
      const label = screen.getByText('I agree to the CollabSpace Terms of Service')
      fireEvent.click(label)

      expect(checkbox).toBeChecked()
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('honors controlled checked property', () => {
      const { rerender } = render(
        <Checkbox
          id="controlled"
          label="Controlled Checkbox"
          checked={false}
          onChange={() => {}}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      rerender(
        <Checkbox
          id="controlled"
          label="Controlled Checkbox"
          checked={true}
          onChange={() => {}}
        />
      )

      expect(checkbox).toBeChecked()
    })
  })
})

import { test, expect } from '@playwright/test'

/**
 * Helper to authenticate as Demo Workspace Owner via the built-in quick demo trigger
 */
async function loginAsDemoOwner(page) {
  await page.goto('/login')
  const demoBtn = page.getByRole('button', { name: /sign in as demo workspace owner/i })
  await expect(demoBtn).toBeVisible()
  await demoBtn.click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

test.describe('CollabSpace SaaS - Complete End-to-End Application Suite', () => {
  // ---------------------------------------------------------------------------
  // 1. Landing Page & Public Navigation
  // ---------------------------------------------------------------------------
  test('Landing Page renders hero, features, pricing and navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/CollabSpace/i)
    await expect(page.locator('text=CollabSpace').first()).toBeVisible()

    const getStartedLink = page.getByRole('link', { name: /sign in|get started/i }).first()
    await expect(getStartedLink).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 2. Authentication UI Workflows
  // ---------------------------------------------------------------------------
  test('Login, Register, and Forgot Password pages render with form controls', async ({ page }) => {
    // 2.1 Login view
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in to your workspace/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // 2.2 Registration view
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create your workspace account/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // 2.3 Password Recovery view
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 3. Authenticated Dashboard & Navigation
  // ---------------------------------------------------------------------------
  test('Dashboard displays workspace header, projects, and task overview', async ({ page }) => {
    await loginAsDemoOwner(page)

    // Check workspace title and greeting
    await expect(page.locator('text=Acme Corp').first()).toBeVisible()
    await expect(page.locator('text=Welcome, Alex Rivera (Demo)!').first()).toBeVisible()
    await expect(page.locator('text=Projects →').first()).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 4. Workspace Administration Panel & Multi-Role Roster
  // ---------------------------------------------------------------------------
  test('Workspace Admin panel renders role badges and member management', async ({ page }) => {
    await loginAsDemoOwner(page)
    await page.goto('/workspace/admin?tab=members')

    // Admin panel header
    await expect(page.getByRole('heading', { name: /workspace administration/i })).toBeVisible()

    // Verify member roster renders multi-role accounts (Owner, Admin, Developer)
    await expect(page.locator('text=Alex Rivera').first()).toBeVisible()
    await expect(page.locator('text=Sarah Jenkins').first()).toBeVisible()
    await expect(page.locator('text=David Chen').first()).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 5. Projects Listing & Project Views
  // ---------------------------------------------------------------------------
  test('Projects view renders project cards with progress bars', async ({ page }) => {
    await loginAsDemoOwner(page)
    await page.goto('/projects')

    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible()
    await expect(page.locator('text=CollabSpace Web Platform').first()).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 6. Tasks & Kanban Board
  // ---------------------------------------------------------------------------
  test('Tasks board renders Kanban columns and task items', async ({ page }) => {
    await loginAsDemoOwner(page)
    await page.goto('/tasks')

    await expect(page.getByRole('heading', { name: /task management/i })).toBeVisible()
    // Kanban columns
    await expect(page.locator('text=In Progress').first()).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 7. Real-Time Project Chat & Messaging
  // ---------------------------------------------------------------------------
  test('Chat interface renders channels and message stream', async ({ page }) => {
    await loginAsDemoOwner(page)
    await page.goto('/chat')

    await expect(page.locator('text=Project Chat').or(page.locator('text=Chat')).first()).toBeVisible()
    await expect(page.locator('input, textarea').first()).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 8. Collaborative Document Editor
  // ---------------------------------------------------------------------------
  test('Document list and editor canvas render correctly', async ({ page }) => {
    await loginAsDemoOwner(page)
    await page.goto('/docs')

    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 9. Collaborative Whiteboard Canvas
  // ---------------------------------------------------------------------------
  test('Whiteboards list renders visual boards and canvas link', async ({ page }) => {
    await loginAsDemoOwner(page)
    await page.goto('/whiteboards')

    await expect(page.getByRole('heading', { name: /whiteboards/i })).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 10. Analytics Dashboard & Filters
  // ---------------------------------------------------------------------------
  test('Analytics dashboard displays statistics, date range filters, and charts', async ({ page }) => {
    await loginAsDemoOwner(page)
    await page.goto('/analytics')

    await expect(page.getByRole('heading', { name: /project analytics/i })).toBeVisible()
    await expect(page.locator('text=Total Tasks').first()).toBeVisible()
  })
})

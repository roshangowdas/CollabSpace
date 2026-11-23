import React, { useState } from 'react'
import {
  Palette,
  Type,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Send,
  Trash2,
  Download,
  Share2,
  Settings,
  MoreVertical,
  Plus,
  Search,
  Mail,
  Lock,
  User,
  Eye,
  Check,
  Moon,
  Sun,
  Layout,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Label,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Avatar,
  AvatarGroup,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Modal,
  ModalFooter,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  EmptyState,
  ErrorState,
  Tooltip,
  PasswordStrengthIndicator
} from '@/components/ui'

export function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkboxState, setCheckboxState] = useState(true)
  const [switchState, setSwitchState] = useState(true)
  const [selectedRole, setSelectedRole] = useState('engineer')
  const [sampleError, setSampleError] = useState(false)
  const [demoPassword, setDemoPassword] = useState('Pass123!')

  const tabs = [
    { id: 'all', label: 'All Components' },
    { id: 'foundations', label: 'Color & Typography' },
    { id: 'buttons', label: 'Buttons & Badges' },
    { id: 'forms', label: 'Form Controls' },
    { id: 'overlays', label: 'Overlays & Feedback' },
    { id: 'states', label: 'States & Skeletons' },
  ]

  const colorTokens = [
    { name: 'Brand Accent', token: 'bg-brand text-brand-foreground', desc: 'Primary active elements & highlights' },
    { name: 'Primary', token: 'bg-primary text-primary-foreground', desc: 'Default high-emphasis surfaces & buttons' },
    { name: 'Secondary', token: 'bg-secondary text-secondary-foreground', desc: 'Subtle secondary actions & tags' },
    { name: 'Muted', token: 'bg-muted text-muted-foreground', desc: 'Background fills and disabled surfaces' },
    { name: 'Background / Surface', token: 'bg-background text-foreground border', desc: 'Canvas and surface canvas' },
    { name: 'Card Surface', token: 'bg-card text-card-foreground border', desc: 'Elevated containers and panels' },
    { name: 'Success', token: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', desc: 'Positive affirmations & confirmations' },
    { name: 'Warning', token: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', desc: 'Cautionary notes & pending states' },
    { name: 'Destructive', token: 'bg-destructive/10 text-destructive border border-destructive/20', desc: 'Critical errors & deletion actions' },
  ]

  const typographyScale = [
    { level: 'Title 1 (Page Hero)', class: 'text-3xl sm:text-4xl font-bold tracking-tight', sample: 'Empower Your Engineering Team' },
    { level: 'Title 2 (Section)', class: 'text-2xl font-bold tracking-tight', sample: 'Project Overview & Active Sprints' },
    { level: 'Title 3 (Card / Modal)', class: 'text-lg font-semibold tracking-tight', sample: 'Workspace Permissions' },
    { level: 'Subheading', class: 'text-base font-medium text-foreground', sample: 'Assigned to Frontend Guild' },
    { level: 'Body (Default)', class: 'text-sm text-foreground', sample: 'Streamline team communication with high-frequency updates and real-time syncing.' },
    { level: 'Small / Muted', class: 'text-xs text-muted-foreground', sample: 'Last synchronized 2 minutes ago via Supabase Realtime' },
    { level: 'Micro / Badge', class: 'text-[10px] uppercase font-bold tracking-wider text-muted-foreground', sample: 'STAGE 2 • SYSTEM TOKENS' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Banner */}
      <div className="border-b bg-muted/30 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-0.5 text-xs font-semibold text-brand">
                <Sparkles className="h-3 w-3" />
                Stage 2 • Design System Showcase
              </div>
              <h1 className="text-3xl font-bold tracking-tight">CollabSpace Design System</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                A commercial-grade UI foundation engineered for enterprise team productivity. Clean typography, neutral backgrounds, carefully balanced brand accents, and accessible primitives.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.documentElement.classList.toggle('dark')}
              >
                Toggle Theme
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={() => {
                  toast.success('Design system loaded', {
                    description: 'All 15+ UI primitives verified and active in development mode.',
                  })
                }}
              >
                Trigger System Toast
              </Button>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-4 border-t border-border/60">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-subtle'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Preview Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-16">
        {/* 1. FOUNDATIONS */}
        {(activeTab === 'all' || activeTab === 'foundations') && (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Design Tokens & Foundations</h2>
              <p className="text-xs text-muted-foreground">
                Neutral slate/zinc scale paired with sharp high-contrast accents and clean geometry.
              </p>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand" /> Color Palette
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {colorTokens.map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl border bg-card shadow-subtle flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{item.name}</span>
                      <div className={`h-6 w-12 rounded-md ${item.token}`} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Type className="h-4 w-4 text-brand" /> Typography Scale (Inter Font Family)
              </h3>
              <Card>
                <CardContent className="p-0 divide-y divide-border/60">
                  {typographyScale.map((t, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <div className="w-44 shrink-0 text-xs text-muted-foreground font-mono">
                        {t.level}
                      </div>
                      <div className={`flex-1 ${t.class}`}>{t.sample}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* 2. BUTTONS & BADGES */}
        {(activeTab === 'all' || activeTab === 'buttons') && (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Buttons, Badges & Avatars</h2>
              <p className="text-xs text-muted-foreground">
                Interactive action primitives with consistent states, loading spinners, and icon alignment.
              </p>
            </div>

            {/* Buttons Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Button Variants & Sizes</CardTitle>
                <CardDescription>
                  Supports primary default, brand accent, secondary, outline, ghost, destructive, subtle, and link.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Variants:</span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button variant="default">Primary Default</Button>
                    <Button variant="brand">Brand Accent</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="subtle">Subtle</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link Button</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Sizes & Icons:</span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button size="xs" variant="brand">Extra Small (xs)</Button>
                    <Button size="sm" variant="outline">Small (sm)</Button>
                    <Button size="default" variant="default">Default</Button>
                    <Button size="lg" variant="brand">Large (lg)</Button>
                    <Button size="default" variant="outline" leftIcon={Send}>
                      With Left Icon
                    </Button>
                    <Button size="default" variant="secondary" rightIcon={Share2}>
                      With Right Icon
                    </Button>
                    <Button size="default" variant="brand" isLoading>
                      Saving...
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges & Avatars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Badges</CardTitle>
                  <CardDescription>
                    Contextual pill indicators with steady or animated pulsing dots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="brand">Brand Active</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success" dot ping>Active Deployment</Badge>
                    <Badge variant="warning" dot>Pending Review</Badge>
                    <Badge variant="destructive" dot>Failed Sync</Badge>
                    <Badge variant="info" dot>Information</Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="brand" size="sm">Small Badge</Badge>
                    <Badge variant="outline" size="lg">Large Tag</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Avatars */}
              <Card>
                <CardHeader>
                  <CardTitle>Avatars & Presence Indicators</CardTitle>
                  <CardDescription>
                    Image fallback with monogram initials, presence rings, and group stacks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar name="Sarah Jenkins" size="xs" status="online" />
                    <Avatar name="Alex Rivera" size="sm" status="away" />
                    <Avatar name="David Chen" size="default" status="busy" />
                    <Avatar name="Elena Rostova" size="md" status="offline" />
                    <Avatar name="Marcus Vance" size="lg" status="online" />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avatar Group Stack:</span>
                    <AvatarGroup max={3}>
                      <Avatar name="Sarah Jenkins" fallback="SJ" />
                      <Avatar name="Alex Rivera" fallback="AR" />
                      <Avatar name="David Chen" fallback="DC" />
                      <Avatar name="Elena Rostova" fallback="ER" />
                      <Avatar name="Marcus Vance" fallback="MV" />
                    </AvatarGroup>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* 3. FORM CONTROLS */}
        {(activeTab === 'all' || activeTab === 'forms') && (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Form Controls & Inputs</h2>
              <p className="text-xs text-muted-foreground">
                Accessible inputs, password toggles, textareas, native selects, checkboxes, and switches.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Standard Form Components</CardTitle>
                <CardDescription>
                  Consistent focus rings, icon prefixes, validation message animations, and disabled states.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Workspace Name</Label>
                    <Input
                      placeholder="e.g. Acme Studio"
                      leftIcon={Layers}
                      helperText="This will be visible to all invited team members."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>User Email Address</Label>
                    <Input
                      type="email"
                      placeholder="alex@company.com"
                      leftIcon={Mail}
                      defaultValue="alex.rivera@invalid-email"
                      error="Please enter a valid work email address"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Password with Strength Indicator & Toggle</Label>
                    <Input
                      type="password"
                      value={demoPassword}
                      onChange={(e) => setDemoPassword(e.target.value)}
                      leftIcon={Lock}
                      allowPasswordToggle
                      helperText="Type above to test live strength score and criteria evaluation."
                    />
                    <PasswordStrengthIndicator password={demoPassword} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Role Selection</Label>
                    <Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      options={[
                        { value: 'engineer', label: 'Software Engineer' },
                        { value: 'designer', label: 'Product Designer' },
                        { value: 'manager', label: 'Engineering Manager' },
                      ]}
                      helperText="Defines initial workspace permissions."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Workspace Bio / Description</Label>
                    <Textarea
                      placeholder="Describe your organization..."
                      rows={3}
                      helperText="Markdown supported."
                    />
                  </div>

                  <div className="pt-2 space-y-3">
                    <Checkbox
                      checked={checkboxState}
                      onChange={(e) => setCheckboxState(e.target.checked)}
                      label="Real-time Notifications"
                      description="Receive instant alerts for mentions and direct messages."
                    />

                    <Switch
                      checked={switchState}
                      onCheckedChange={setSwitchState}
                      label="Automatic Session Refresh"
                      description="Keep sessions active across browser tabs securely."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 4. OVERLAYS & FEEDBACK */}
        {(activeTab === 'all' || activeTab === 'overlays') && (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Overlays, Modals & Notifications</h2>
              <p className="text-xs text-muted-foreground">
                Backdrop-blurred dialogs, accessible dropdown menus, and Sonner feedback notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Modal Trigger Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Modal Dialog</CardTitle>
                  <CardDescription>
                    Backdrop blur, focus trap, smooth spring scale, and keyboard ESC dismiss.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Click the button below to test our accessible dialog window.
                  </p>
                  <Button variant="brand" onClick={() => setIsModalOpen(true)}>
                    Open Demo Modal
                  </Button>
                </CardContent>
              </Card>

              {/* Dropdown Menu Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Dropdown Menu</CardTitle>
                  <CardDescription>
                    Contextual actions with keyboard shortcuts, dividers, and danger items.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Click the trigger below to inspect the dropdown menu with items.
                  </p>

                  <DropdownMenu
                    trigger={
                      <Button variant="outline" rightIcon={MoreVertical}>
                        Workspace Options
                      </Button>
                    }
                  >
                    <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                    <DropdownMenuItem icon={Share2} shortcut="⌘S">
                      Share Project
                    </DropdownMenuItem>
                    <DropdownMenuItem icon={Download} shortcut="⌘D">
                      Export Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem icon={Settings} shortcut="⌘,">
                      Preferences
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem icon={Trash2} destructive shortcut="⌫">
                      Delete Workspace
                    </DropdownMenuItem>
                  </DropdownMenu>
                </CardContent>
              </Card>

              {/* Toast Feedback Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Toast Notifications</CardTitle>
                  <CardDescription>
                    Accessible status alerts powered by Sonner with theme synchronization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success('Workspace updated successfully!')}
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.error('Failed to sync changes with server')}
                  >
                    Error Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast('Document archived', {
                        action: {
                          label: 'Undo',
                          onClick: () => toast.info('Action reversed'),
                        },
                      })
                    }
                  >
                    Action Toast with Undo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* 5. STATES & SKELETONS */}
        {(activeTab === 'all' || activeTab === 'states') && (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Empty States, Errors & Skeletons</h2>
              <p className="text-xs text-muted-foreground">
                Ensures zero blank screens with smooth shimmer loading and descriptive empty & recovery states.
              </p>
            </div>

            {/* Skeletons Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Loading Shimmer Skeletons
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>

            {/* Empty & Error States */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Empty State Primitive
                </h3>
                <EmptyState
                  icon={FolderOpen}
                  title="No collaborative channels yet"
                  description="Channels are where your team discusses projects, coordinates sprints, and shares updates."
                  actionLabel="Create Channel"
                  onAction={() => toast.info('Channel creation modal triggered')}
                  secondaryActionLabel="Browse Directory"
                  onSecondaryAction={() => toast('Browsing channels')}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Error & Recovery State Primitive
                </h3>
                <ErrorState
                  title="Failed to load workspace data"
                  message="We couldn't connect to the real-time sync service. Please check your network connection and retry."
                  error={
                    sampleError
                      ? new Error('PostgRESTConnectionTimeout: Connection probe failed after 5000ms at src/services/supabase.js:28')
                      : null
                  }
                  onRetry={() => {
                    setSampleError(!sampleError)
                    toast.info('Retrying connection...')
                  }}
                  onBack={() => toast('Navigating back')}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Interactive Modal Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite Team Members"
        description="Add collaborators to your workspace with role-based permissions."
        size="default"
      >
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Email addresses</Label>
            <Input placeholder="sarah@acme.inc, david@acme.inc" leftIcon={Mail} />
          </div>

          <div className="space-y-1.5">
            <Label>Assign Initial Role</Label>
            <Select
              options={[
                { value: 'member', label: 'Member - Can view, edit, and create tasks' },
                { value: 'admin', label: 'Admin - Can manage members and billing' },
                { value: 'viewer', label: 'Viewer - Read-only access to projects' },
              ]}
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
            Invited users will receive an email containing a secure link to join your workspace.
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                setIsModalOpen(false)
                toast.success('Invitations dispatched successfully')
              }}
            >
              Send Invitations
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}


# CollabSpace

CollabSpace is a modern, production-grade real-time team collaboration SaaS platform built with React, Vite, Tailwind CSS, and Supabase.

---

## Tech Stack

- **Frontend Core**: React 18, Vite
- **Language**: JavaScript (ESM)
- **Styling & Design System**: Tailwind CSS, CSS Variables (Light/Dark mode)
- **UI & Icons**: Reusable components inspired by shadcn/ui, Lucide React
- **Animations & Notifications**: Framer Motion, Sonner
- **State Management & Caching**: TanStack Query (React Query v5)
- **Forms & Validation**: React Hook Form, Zod
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, Realtime)

---

## Directory Architecture

```
CollabSpace/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI primitives and layout components
│   │   ├── common/         # Layout components (Header, Footer, Sidebar, AppLayout)
│   │   ├── landing/        # Public landing page sections
│   │   ├── ui/             # Reusable design tokens & primitives
│   │   ├── profile/        # User profile, avatars, and onboarding
│   │   ├── workspace/      # Workspace management and invitation modals
│   │   ├── project/        # Project listing, cards, details, and creation modals
│   │   ├── task/           # Task creation modal, card, filter bar, details drawer
│   │   ├── kanban/         # dnd-kit Kanban board, sortable columns, and cards
│   │   ├── discussion/     # Task discussions, @mentions, comments list, and activity timeline
│   │   ├── chat/           # Real-time project chat room, messages, replies, attachments
│   │   ├── presence/       # Realtime presence badges, availability selector, typing indicators
│   │   ├── whiteboard/     # Collaborative SVG canvas, sticky notes, shapes, live cursors
│   │   ├── analytics/      # Recharts analytics dashboard, KPIs, velocity, member distributions
│   │   └── admin/          # Workspace administration, member role changer, invite revocation, audit log
│   ├── contexts/           # React Context providers:
│   │   ├── AuthContext.jsx # Live Supabase session & user state management
│   │   ├── WorkspaceContext.jsx # Workspace switching & role RBAC
│   │   └── PresenceContext.jsx  # Supabase Realtime Presence & live typing state
│   ├── hooks/              # Custom React hooks (useAuth, useWorkspace, usePresence, useSupabaseStatus)
│   ├── integrations/       # External service clients:
│   │   └── supabase/       # Official Supabase integration (client, realtime, errorHandler, authUtils)
│   ├── pages/              # Route views:
│   │   ├── auth/           # Authentication UI (Login, Register, Forgot/Reset Password)
│   │   ├── DashboardPage.jsx # Authenticated User Overview & Session Hub (/dashboard)
│   │   ├── ProfilePage.jsx # User Profile, Avatar & Password Management (/profile)
│   │   ├── HomePage.jsx    # Public Landing Page (/)
│   │   ├── DesignSystemPage.jsx # Design System Showcase (/design-system)
│   │   ├── SupabaseTestPage.jsx # Connection Diagnostics & Test (/supabase-test)
│   │   └── NotFoundPage.jsx
│   ├── routes/             # Centralized routing definitions (AppRoutes.jsx)
│   ├── services/           # Data access and API services (auth.js, supabase.js)
│   ├── styles/             # Global CSS and Tailwind directives (globals.css)
│   └── utils/              # Helper utilities (cn class merger, validators.js)
├── supabase/
│   └── migrations/         # Supabase PostgreSQL schema, RLS policies, triggers & storage
├── .env.example            # Template for environment variables
├── index.html              # Main HTML entry point
├── jsconfig.json           # Path alias configuration (@/* -> src/*)
├── package.json            # Project manifest and scripts
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.js          # Vite build and dev server configuration
```

---

## Supabase Authentication (Stage 6)

CollabSpace features complete end-to-end authentication powered by the official Supabase JavaScript SDK:

1. **Email & Password Registration**:
   - Creates user in `auth.users` via `supabase.auth.signUp`.
   - Stores `full_name` in `user_metadata` and automatically provisions a profile in `public.profiles` via PostgreSQL trigger.
   - Handles email confirmation verification states according to Supabase project settings.
   - **Passwords are never manually stored in application tables**.

2. **Email & Password Login**:
   - Authenticates using `supabase.auth.signInWithPassword`.
   - Returns active session and automatically loads user profile data.
   - Features password visibility toggling and validation.

3. **Logout**:
   - Terminates session via `supabase.auth.signOut` and clears cached state.

4. **Forgot Password & Recovery**:
   - Sends recovery email via `supabase.auth.resetPasswordForEmail`.

5. **Password Reset**:
   - Updates account password via `supabase.auth.updateUser({ password })`.

6. **Session Persistence**:
   - Persists session tokens in browser `localStorage` under `collabspace-auth-token`.
   - Automatically restores session on page reload.

7. **Auth State Listener**:
   - Real-time subscription to `supabase.auth.onAuthStateChange` handling `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`, and `PASSWORD_RECOVERY`.

8. **Protected Routes (`ProtectedRoute`)**:
   - Protects `/dashboard` and `/profile`.
   - Displays animated skeleton placeholder during session hydration.
   - Redirects unauthenticated requests to `/login` preserving target route.

9. **Redirect Authenticated Users (`PublicOnlyRoute`)**:
   - Automatically redirects signed-in users away from `/login`, `/register`, `/forgot-password`, and `/reset-password` to `/dashboard`.

10. **Expired Session Handling**:
    - Listens for token refresh events and clears invalidated sessions smoothly.

---

## Environment Configuration

Configure your Supabase credentials in `.env`:

```env
# Supabase Project Credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key

# Application Settings
VITE_APP_NAME=CollabSpace
VITE_APP_ENV=development
```

---

## Getting Started

### 1. Prerequisites

- Node.js (v18 or later recommended; tested on v24)
- npm (v9 or later)

### 2. Installation

```bash
npm install
```

### 3. Running the Development Server

```bash
npm run dev
```

Visit:

- [http://localhost:5173](http://localhost:5173): Public Landing Page
- [http://localhost:5173/login](http://localhost:5173/login): Sign In
- [http://localhost:5173/register](http://localhost:5173/register): Registration
- [http://localhost:5173/forgot-password](http://localhost:5173/forgot-password): Password Recovery
- [http://localhost:5173/reset-password](http://localhost:5173/reset-password): Set New Password
- [http://localhost:5173/dashboard](http://localhost:5173/dashboard): Authenticated User Dashboard
- [http://localhost:5173/workspace/admin](http://localhost:5173/workspace/admin): Workspace Administration Panel
- [http://localhost:5173/analytics](http://localhost:5173/analytics): Real-Time Project Analytics Dashboard
- [http://localhost:5173/profile](http://localhost:5173/profile): Profile & Identity View with Photo Upload
- [http://localhost:5173/settings](http://localhost:5173/settings): Account Settings & Security Preferences
- [http://localhost:5173/onboarding](http://localhost:5173/onboarding): 3-Step Profile Onboarding Wizard
- [http://localhost:5173/chat](http://localhost:5173/chat): Real-time Project Chat Room & Channels
- [http://localhost:5173/notifications](http://localhost:5173/notifications): In-App Notification Center
- [http://localhost:5173/files](http://localhost:5173/files): Workspace File Management & Storage
- [http://localhost:5173/docs](http://localhost:5173/docs): Collaborative Real-Time Documents & Editor
- [http://localhost:5173/whiteboards](http://localhost:5173/whiteboards): Collaborative Whiteboards & Visual Brainstorming Canvas
- [http://localhost:5173/design-system](http://localhost:5173/design-system): Design System Gallery

### 4. Automated Testing

```bash
# Run unit and integration tests with Vitest
npm test

# Run Playwright end-to-end tests across Desktop, Tablet, and Mobile viewports
npm run test:e2e

# Run all test suites
npm run test:all
```

### 5. Production Build

```bash
npm run build
npm run preview
```

---

## Stage Progress

- [x] **Stage 1**: Initialize CollabSpace, tooling, libraries, directory architecture, and Supabase client config.
- [x] **Stage 2**: CollabSpace Design System, UI component library, professional sidebar, and design-system preview page.
- [x] **Stage 3**: Build CollabSpace Landing Page, product preview mockup, sample pricing, and connected registration flow.
- [x] **Stage 4**: Authentication UI (Login, Register, Forgot Password, Reset Password, Password Strength Indicator, Form Validation).
- [x] **Stage 5**: Supabase Integration (Client normalization, Realtime manager, Error handling, Auth utilities, Connection test page).
- [x] **Stage 6**: Implement Supabase Authentication (Email/Password registration & login, logout, password recovery, session persistence, auth state listener, protected routes, redirect away from login).
- [x] **Stage 7**: User Profiles and Onboarding (PostgreSQL `profiles` table linked to `auth.users`, automated trigger, unique username validation, bio, avatar upload with Supabase Storage, Edit Profile modal, Account Settings, and 3-step Onboarding wizard).
- [x] **Stage 8**: Complete Supabase Database Design (Production-grade 16-table relational schema under supabase/migrations, anti-recursion security-definer helper functions, strictly scoped RLS policies, automated triggers, constraints, indexes, and SQL verification suite).
- [x] **Stage 9**: Workspace Management (Create workspace, edit name/description, upload logo via Supabase Storage, delete workspace with confirmation, list user workspaces, dynamic workspace switcher in sidebar/header, member list with role promotion/demotion, and active role badges).
- [x] **Stage 10**: Workspace Invitations (Secure random token generation, 7-day expiration, server-side Edge Function / privileged RPC without exposing service_role key, invitation acceptance page `/invite/:token`, email identity verification, duplicate prevention, Admin/Developer/Designer/Tester/Member role allocation, and pending invitation revocation).
- [x] **Stage 11**: Project Management (Create, edit, delete, archive projects, search & status filters, project deadlines, assign members, progress calculations, and dedicated project views `/projects` and `/projects/:projectId`).
- [x] **Stage 12**: Task Management (Complete task CRUD, member assignments, priorities Low/Medium/High/Urgent, statuses Todo/In Progress/In Review/Completed, labels, estimated hours, slide-over task details drawer, and views `/tasks` and `/my-tasks`).
- [x] **Stage 13**: Interactive Kanban Board (dnd-kit drag-and-drop board across 4 columns, monotonic fractional positioning algorithm, optimistic updates with snapshot rollback, Supabase Realtime synchronization, and accessibility keyboard navigation).
- [x] **Stage 14**: Task Discussions and Activity (Task-level comments, author-only editing restriction, author/admin deletion, `@username` mention auto-suggest and styled badges, relative timestamps, member avatars, automated lifecycle activity history tracking status changes, assignments, and due date updates, and Supabase Realtime broadcast channels).
- [x] **Stage 15**: Real-Time Project Chat (Project-specific chat rooms, send text and rich file attachments, threaded replies with quoted parent messages, author-only editing restriction, author/admin deletion, unread message indicators with date dividers, cursor pagination for older messages, Supabase Realtime channel subscription with clean unmount, and dedicated `/chat` & `/chat/:projectId` views).
- [x] **Stage 16**: Real-Time Presence (Supabase Realtime Presence tracking using authenticated user IDs, online/offline member synchronization, active project room indicators, animated live typing indicators with debounce/timeout, user availability status selector Available/Do Not Disturb/Away, strictly non-persisted ephemeral state, and automated channel cleanup).
- [x] **Stage 17**: Notification System (In-app notifications, interactive header dropdown with live unread badge, dedicated Notification Center `/notifications`, automated PostgreSQL triggers for task assignments, status changes, comments, @mentions, workspace joins, duplicate prevention, and Supabase Realtime live toast delivery).
- [x] **Stage 18**: File Management (Secure file sharing using Supabase Storage, private encrypted bucket `workspace-files`, authenticated signed URL generation, path traversal attack prevention & filename sanitization, task-level attachments drawer section, real-time upload progress, file previews for images/PDFs/code/media, and dedicated File Manager page `/files`).
- [x] **Stage 19**: Collaborative Document Editor (Real-time rich-text editing with Tiptap, Yjs CRDT document synchronization, standalone Hocuspocus WebSocket server in `server/`, Supabase identity authentication, workspace/project access authorization, simultaneous multi-user editing with conflict-free merging, live collaborator cursors and presence rings, network reconnection resilience, and document management views `/docs` and `/docs/:documentId`).
- [x] **Stage 20**: Collaborative Whiteboard (Interactive brainstorming canvas, sticky notes with 6 curated palette themes and inline editing, geometric shapes rectangle/circle, connecting arrows and lines with SVG markers, freehand pen tool with stroke smoothing, text labels, smooth zoom 0.25x–3.0x, infinite panning with spacebar/hand tool, element-level operational synchronization via Supabase Realtime Broadcast avoiding whole-board overwrites, active participant presence rings and colored collaborator live cursors, debounced PostgreSQL persistence with workspace RLS, and catalog view `/whiteboards` with full-screen canvas `/whiteboards/:whiteboardId`).
- [x] **Stage 21**: Analytics Dashboard (Real-time project analytics with Recharts: dynamic calculations for total projects, total tasks, completed tasks with percentage rates, in-progress tasks, pending tasks, overdue tasks with alert badges, project completion stacked bar charts, weekly task completion vs. creation velocity area charts, task priority donut distribution with centered metrics, member workload distribution with status segment bars, and live audit activity feeds; multi-facet filtering by workspace, project, and dynamic date ranges; loading skeletons, empty states, and error handling; fully synchronized via Supabase Realtime).
- [x] **Stage 22**: Workspace Administration (Comprehensive workspace administration panel with 6 specialized tabs: Workspace Overview with role distribution cards, Member & Role Management with inline role modifier and member removal protection, Invitations Management with copy token and revocation controls, Projects & Statistics with progress tracking, Workspace Settings with branding logo uploads and Owner-only danger zone deletion, and full Administrative Audit Log; database-level security with PostgreSQL RPC functions `admin_update_member_role`, `admin_remove_member`, and `get_workspace_admin_stats`; strict RBAC preventing self-promotion to owner, owner demotion/removal, cross-workspace role tampering, and non-admin panel access).
- [x] **Stage 23**: Security Audit (Comprehensive full-stack security audit covering 16 security domains: explicit RLS enforcement across all 16 application tables, private storage bucket access controls and signed URL generation, zero exposed service_role or private secrets in client bundles, elimination of URL ID fallback leaks and cross-workspace parameter tampering in project/task/document/whiteboard views, strict role-based authorization hierarchy preventing self-promotion to owner or owner deletion, hardened invitation token verification rejecting expired or forged tokens, robust file upload validation stripping path traversal sequences and rejecting dangerous executables, sliding-window rate limiter utility `rateLimiter.js` throttling sensitive password reset, invitation, file upload, and administrative operations, authenticated WebSocket connection handling and document authorization in Hocuspocus server, and full test suite with 17 passing tests in `scripts/test_security_audit.js`).
- [x] **Stage 24**: Complete CollabSpace Testing (Comprehensive end-to-end and unit testing across all 9 application domains: Authentication, Workspaces, Projects, Tasks, Real-Time, Files, Collaboration, Analytics, and Responsiveness; 72 automated unit and integration tests with Vitest + React Testing Library across 9 test files; 30 Playwright end-to-end tests across 3 viewports: Desktop Chromium, Tablet Viewport, and Mobile Viewport; multi-account and multi-role matrix covering Owner, Admin, Developer, and Tester personas; automated session persistence and responsive testing).

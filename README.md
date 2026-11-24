<div align="center">

  <!-- Dynamic 3D Capsule Header Banner -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,1,2,3&height=260&section=header&text=CollabSpace&fontSize=70&fontAlignY=38&desc=The%20Real-Time%20Team%20Operating%20System&descFontSize=22&descAlignY=58&animation=fadeIn" width="100%" alt="CollabSpace 3D Header" />

  <p align="center">
    <strong>A high-velocity, real-time team collaboration SaaS platform.</strong><br />
    Sprint Kanban, CRDT Collaborative Docs, Infinite Canvas Whiteboards, Real-Time Project Chat, and Enterprise RBAC.
  </p>

  <!-- Premium 3D Badges Grid -->
  <p align="center">
    <a href="#test-suite-status"><img src="https://img.shields.io/badge/Unit_Tests-74%2F74_Passing-10b981?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest Tests" /></a>
    <a href="#security-audit-status"><img src="https://img.shields.io/badge/Security_Audit-17%2F17_Hardened-6366f1?style=for-the-badge&logo=shield&logoColor=white" alt="Security Hardening" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-06b6d4?style=for-the-badge&logo=react&logoColor=white" alt="React Vite" /></a>
    <a href="#database--real-time-infrastructure"><img src="https://img.shields.io/badge/Backend-Supabase_PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="#design-system"><img src="https://img.shields.io/badge/Design_System-Hoy_Tokens-191918?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Hoy Design System" /></a>
    <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=for-the-badge&logo=github&logoColor=white" alt="Contributions Welcome" /></a>
    <img src="https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge" alt="License" />
  </p>

  <!-- Interactive Quick Navigation Bar -->
  <p align="center">
    <a href="#-core-platform-modules"><b>Explore Modules</b></a> •
    <a href="#️-system-architecture--3d-building-roadmap"><b>3D Architecture &amp; Roadmap</b></a> •
    <a href="#-quick-start"><b>Quick Start</b></a> •
    <a href="#-security--data-isolation"><b>Security & RLS</b></a> •
    <a href="#-interactive-design-system"><b>Design System</b></a> •
    <a href="#-verification--testing"><b>Test Matrix</b></a> •
    <a href="#-contributing"><b>Contributing</b></a>
  </p>

</div>

---

## ⚡ Tech Stack & Interactive Ecosystem

<div align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,tailwind,supabase,postgres,nodejs,git,github,postman&theme=dark" alt="CollabSpace Technology Icons" />
</div>

<br />

| Layer | Technologies & Libraries | Key Highlights |
| :--- | :--- | :--- |
| **Core Frontend** | React 18, Vite 6, JavaScript (ESM) | Ultra-fast HMR, componentized architecture, zero TypeScript lock-in |
| **Styling & Theme** | Tailwind CSS 3.4, Hoy Design System | Warm dark (`#191918`), warm cream (`#ECECEA`), 6px micro-radii |
| **Icons & UI** | Lucide React, cva, framer-motion | Responsive, accessible, minimal animations, clean typography |
| **Real-Time Data** | Supabase Realtime, Hocuspocus CRDT | WebSockets, live user presence, typing indicators, conflict-free merges |
| **State & Cache** | TanStack React Query v5 | Server state caching, optimistic updates, background hydration |
| **Forms & Security** | React Hook Form, Zod, DOMPurify logic | Sliding-window rate limiting, input sanitization, strict XSS protection |
| **Testing** | Vitest, React Testing Library, Playwright | 74 unit tests, 17 security tests, 30 multi-viewport E2E tests |

---

## 💎 Core Platform Modules

Click any interactive module below to reveal its architectural specifications, database tables, and real-time workflows:

<details open>
<summary><h3>📌 1. Sprint Kanban Boards & Backlog Management</h3></summary>

> **High-velocity sprint tracker powered by `@dnd-kit` and Supabase Realtime.**

- **Monotonic Fractional Positioning**: Re-order cards seamlessly across columns without full-table index collisions.
- **Optimistic UI with Rollback**: Instant drag-and-drop feedback with automatic state snapshot recovery if network fails.
- **Multi-Factor Filtering**: Live instant search, project attribution, priority flags (Low, Medium, High, Urgent), and status columns (`Todo`, `In Progress`, `In Review`, `Completed`).
- **Slide-Over Task Drawer**: Deep dive into subtasks, attachments, and real-time comment threads.

```
[Backlog / Todo] ───( Drag & Drop )───► [In Progress] ───► [In Review] ───► [Completed]
        ▲                                                                           │
        └─────────────────────── Realtime Sync (PostgreSQL CDC) ────────────────────┘
```
</details>

<details>
<summary><h3>💬 2. Real-Time Project Chat & Threaded Messaging</h3></summary>

> **Dedicated project channels, file attachments, and live availability.**

- **Threaded Conversations**: Quoted parent replies, member mentions with `@username` autocomplete, and date dividers.
- **Secure File Attachments**: Upload and preview code files, mockups, images, and documents directly in chat.
- **Author-Only Governance**: Authors can edit or delete their own messages; workspace admins retain supervisory moderation.
- **Live Typing Awareness**: Ephemeral typing badges indicating who is actively typing in the channel.
</details>

<details>
<summary><h3>📝 3. Collaborative Document Editor (CRDT)</h3></summary>

> **Real-time rich text editing powered by Tiptap, Yjs CRDTs, and a dedicated WebSocket server.**

- **Conflict-Free Merging**: Mathematical Yjs CRDT state merging guarantees zero text collisions during simultaneous multi-user typing.
- **Collaborator Cursors & Labels**: Real-time peer cursors, selection highlights, and user presence pills.
- **Dedicated Hocuspocus Server**: Standalone Node.js WebSocket engine (`server/index.js`) authenticating incoming tokens with Supabase.
- **Document Versioning**: Automatic debounced snapshots saved directly to PostgreSQL.
</details>

<details>
<summary><h3>🎨 4. Collaborative Brainstorming Canvas (Whiteboard)</h3></summary>

> **Infinite zoom-and-pan whiteboard canvas for design sprints and architecture wireframing.**

- **Interactive Canvas Elements**: Color-coded sticky notes, geometric shapes (rectangles, circles), directional connecting arrows, and freehand drawing pens.
- **Operational Synchronization**: Broadcasts delta changes via Supabase Realtime channels avoiding destructive full-board overwrites.
- **Participant Presence Rings**: Visual peer indicators showing active collaborators in the canvas.
- **Smooth Navigation**: Pan effortlessly using Spacebar or Hand tool; zoom from 0.25x to 3.0x with smooth focal centering.
</details>

<details>
<summary><h3>📊 5. Team Velocity & Analytics Dashboard</h3></summary>

> **Real-time statistical calculations and dynamic charting with Recharts.**

- **Dynamic Metric Calculations**: Zero hardcoded numbers—every metric is computed dynamically from real database records.
- **Project Completion Breakdown**: Stacked bar charts showcasing tasks completed vs. remaining across projects.
- **Weekly Velocity Trends**: Area charts illustrating creation vs. completion velocity over time.
- **Priority & Member Load**: Donut priority distributions and member workload allocation segment bars.
</details>

<details>
<summary><h3>🛡️ 6. Super Admin Portal & Workspace Governance</h3></summary>

> **Workspace-level administration console restricted exclusively to verified administrators.**

- **Direct URL Security Gate**: Accessible exclusively at `/admin`, guarded by single super admin credentials (`0243roshan@gmail.com`).
- **Sliding-Window Rate Limiting**: Max 5 attempts per minute to block brute-force credential stuffing.
- **6 Core Management Suites**:
  1. **Overview**: Total member counts, task velocity, active projects, and upcoming deadlines.
  2. **Members**: Role modification, member directory, joining dates, and removal controls.
  3. **Projects**: Workspace project CRUD, status badges, and deletion confirmations.
  4. **Tasks**: Comprehensive task search, overdue flags, and assignee attribution.
  5. **Activity**: Chronological audit trail of member joins, role changes, and task completions.
  6. **Settings**: Workspace branding, invitation policies, and Owner-only danger zone deletion.
</details>

---

## 🏛️ System Architecture & 3D Building Roadmap

<div align="center">
<sub>Interactive Engineering Architecture • High-Velocity Real-Time Pipeline from Database RLS to 60 FPS Production Ship</sub>

<br/><br/>

<a href="#-system-architecture--3d-building-roadmap">
  <img src="assets/collabspace-architecture-roadmap-3d.svg" width="100%" alt="CollabSpace 3D Architecture Roadmap" />
</a>

</div>

<br/>

<details>
<summary>🔍 <b>Architecture Flowchart Spec (Click to inspect component interconnects)</b></summary>
<br/>

```mermaid
flowchart TD
  subgraph Client ["Client Browser (React 18 + Vite)"]
    UI["Hoy UI Components & Views"]
    AuthCtx["Auth Context (Session Management)"]
    Query["TanStack React Query Cache"]
    RateLimit["Client Rate Limiter & Sanitizer"]
    YjsClient["Tiptap + Yjs CRDT Client"]
  end

  subgraph Gateway ["Security & Network Layer"]
    SecHeaders["HTTP Security Headers (nosniff, DENY)"]
    Gate["Admin Login Gate (/admin)"]
  end

  subgraph Supabase ["Supabase Backend Infrastructure"]
    SupaAuth["Supabase GoTrue (bcrypt Password Hashing)"]
    Postgres[("PostgreSQL Database (16 Tables + RLS)")]
    Realtime["Realtime WebSocket Engine (CDC & Presence)"]
    Storage["Private Storage Buckets (workspace-files)"]
    RPC["Security Definer RPC Functions"]
  end

  subgraph HocuspocusEngine ["Document Engine (server/)"]
    Hocuspocus["Hocuspocus WebSocket Server (:1234)"]
    DocAuth["JWT Verification & Project Authorization"]
  end

  UI --> RateLimit --> Gateway
  Gateway --> SupaAuth
  UI --> Query --> Postgres
  UI --> Realtime
  UI --> Storage
  Gate --> RPC
  YjsClient <--> Hocuspocus <--> DocAuth <--> Postgres
```

</details>

<br/>

<!-- Interactive Accordions for the 6 Engineering Pipeline Stages -->
<details open>
<summary>🛡️ <b>Stage 01: Multi-Tenant PostgreSQL &amp; 16-Table RLS Core (Click to inspect)</b></summary>
<br/>

> **Foundational Data Security:** Architected the complete relational schema from scratch in PostgreSQL with strict Row Level Security (RLS) across all 16 application tables.
> - **Zero Cross-Tenant Leakage:** Every query enforces `workspace_id` verification via Supabase session policies.
> - **Automated Triggers:** PostgreSQL CDC triggers maintain activity audit logs, user notifications, and membership updates.
> - **Private Storage Buckets:** All uploaded files and mockups are protected under `public = false` with signed storage access.

</details>

<details>
<summary>🔐 <b>Stage 02: Identity, Enterprise RBAC &amp; Rate-Limiting Gate (Click to inspect)</b></summary>
<br/>

> **Zero-Trust Identity Layer:** Hardened authentication with bcrypt password encryption, sliding-window rate limiters, and a dedicated Single Super-Admin gate.
> - **Super Admin Portal (`/admin`):** Guarded exclusively for `0243roshan@gmail.com` with sliding-window protection (max 5 attempts/minute).
> - **Anti-Self-Promotion:** Database triggers prevent non-owners from elevating their own permissions.
> - **Multi-Tenant Roles:** Dynamic permissions across Owner, Admin, Member, and Viewer roles.

</details>

<details>
<summary>📌 <b>Stage 03: Sprint Kanban &amp; Monotonic Fractional Sort Engine (Click to inspect)</b></summary>
<br/>

> **High-Velocity Task Execution:** Drag-and-drop task boards powered by `@dnd-kit` with zero-collision fractional positioning.
> - **Optimistic UI with State Rollback:** Immediate visual reordering with automatic rollback snapshots on network failure.
> - **Monotonic Indexing:** Fractional position mathematics prevent full-table re-indexing during high-frequency drag operations.
> - **Slide-Over Task Drawers:** Comprehensive task inspection with subtasks, file attachments, and real-time comment threads.

</details>

<details>
<summary>⚡ <b>Stage 04: Real-Time Messaging &amp; Live Presence Mesh (Click to inspect)</b></summary>
<br/>

> **Sub-20ms Communication Mesh:** Real-time channel chat and presence tracking powered by Supabase Realtime WebSockets.
> - **Ephemeral Typing Indicators:** Instant awareness showing who is actively typing in the channel.
> - **Heartbeat Presence:** Live online pills and collaborator avatars updating dynamically across workspaces.
> - **Author Governance:** Authors retain edit/delete control over their own messages with admin supervision.

</details>

<details>
<summary>📝 <b>Stage 05: Mathematical CRDT Engine &amp; Infinite Whiteboard (Click to inspect)</b></summary>
<br/>

> **Conflict-Free Collaborative Suite:** Real-time rich-text document editing and infinite canvas design wireframing.
> - **Yjs CRDT Merging:** Mathematical conflict-free replicated data types ensure simultaneous multi-user typing never collides.
> - **Standalone Hocuspocus Server (`server/index.js`):** High-performance WebSocket daemon running on port 1234 with JWT authentication.
> - **Infinite Whiteboard Canvas:** Zoom-and-pan vector canvas with color-coded sticky notes, geometric shapes, and directional connecting arrows.

</details>

<details>
<summary>🚀 <b>Stage 06: Production Hardening, 74/74 Tests &amp; Ship (Click to inspect)</b></summary>
<br/>

> **Enterprise Software Craftsmanship:** Rigorous automated test coverage and strict Hoy Design System adherence.
> - **100% Pass Rate:** All 74 automated unit tests across 9 test files pass with 0 failures.
> - **30 E2E Viewport Tests:** Verified responsive layout across mobile, tablet, and desktop with Playwright.
> - **Dynamic Analytics:** Real-time KPI charts and team velocity metrics calculated dynamically with Recharts.

</details>

---

## 🔒 Security & Data Isolation

CollabSpace is built with a **Security-First Architecture** verified across 17 audit domains:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE CHECKLIST                   │
├────────────────────────────────────────────────────────────────────────┤
│  ✔  Zero Service Role Leakage    │ Client bundle contains anon keys only │
│  ✔  Strict .gitignore Exclusion  │ .env, .env.* never tracked in Git   │
│  ✔  Row Level Security (RLS)     │ Enforced across all 16 tables       │
│  ✔  Private Storage Buckets      │ public = false on all storage files │
│  ✔  Server Password Hashing      │ bcrypt / argon2id with random salts │
│  ✔  Sliding-Window Rate Limits   │ Sign-in, sign-up, admin login, reset│
│  ✔  Input Sanitization           │ Automatic tag stripping & XSS block │
│  ✔  HTTP Security Headers        │ nosniff, DENY, strict-origin        │
│  ✔  Anti-Self-Promotion Checks   │ Database triggers block role spoof  │
└────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>View Database Row Level Security (RLS) Coverage Matrix</b></summary>

| Application Table | RLS Status | Read Policy | Write Policy |
| :--- | :---: | :--- | :--- |
| `public.profiles` | **ACTIVE** | Public read for registered users | User only (`auth.uid() = id`) |
| `public.workspaces` | **ACTIVE** | Workspace members only | Owners & Admins only |
| `public.workspace_members` | **ACTIVE** | Workspace members only | Owners & Admins only |
| `public.workspace_invitations`| **ACTIVE** | Workspace members only | Owners & Admins only |
| `public.projects` | **ACTIVE** | Workspace members only | Workspace members only |
| `public.project_members` | **ACTIVE** | Project members only | Project Admins only |
| `public.tasks` | **ACTIVE** | Project members only | Assigned members & Admins |
| `public.task_comments` | **ACTIVE** | Project members only | Author only edit/delete |
| `public.attachments` | **ACTIVE** | Workspace members only | Uploader only delete |
| `public.activity_logs` | **ACTIVE** | Workspace members only | Read-only automated trigger |
| `public.notifications` | **ACTIVE** | Recipient only (`auth.uid() = user_id`) | System trigger only |
| `public.messages` | **ACTIVE** | Channel members only | Author only edit/delete |
| `public.documents` | **ACTIVE** | Project members only | Project members only |
| `public.document_updates` | **ACTIVE** | Project members only | Collaborative sync only |
| `public.whiteboards` | **ACTIVE** | Workspace members only | Workspace members only |
| `public.whiteboard_elements` | **ACTIVE** | Workspace members only | Workspace members only |

</details>

---

## 🎨 Interactive Design System (Hoy Tokens)

CollabSpace implements the minimalist, conversion-focused **Hoy Design System** (`design-system-hoy`):

<div align="center">

```
  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
  │  Background     │  Text Primary   │  Text Secondary │  Text Light     │
  │  #191918 (Dark) │  #585855        │  #73736F        │  #ECECEA        │
  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

</div>

- **Micro-Radius Scale**: `sm: 1px` • `md: 5px` • `lg: 6px` • `full: 99px` (No oversized generic cards).
- **Typography Font Stack**: `system-ui, ui-rounded, 'Times New Roman', sans-serif`.
- **Typographic Scale**: `xs: 11px` • `sm: 13px` • `base: 15px` • `lg: 16px` • `xl: 21px` • `2xl: 23px` • `3xl: 25px` • `4xl: 29px`.
- **Multi-Tier Elevation**: Custom Hoy shadow curves from `shadow-sm` up to `shadow-21`.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Node.js 20+ recommended)
- **npm**: v9.0.0 or later

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/roshangowdas/CollabSpace.git
cd CollabSpace

# Install project dependencies
npm install
```

### 3. Configure Environment Variables

Copy the template and provide your Supabase publishable credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Supabase Public Configuration (Dashboard > Project Settings > API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key

# Application Settings
VITE_APP_NAME=CollabSpace
VITE_APP_ENV=development
VITE_DEBUG_MODE=true

# Single Super Admin Access
VITE_SUPER_ADMIN_EMAIL=0243roshan@gmail.com
```

### 4. Run Development Servers

```bash
# Launch the React + Vite frontend (http://localhost:5173)
npm run dev

# (Optional) Launch the Hocuspocus Collaborative Document Server
npm run server
```

---

## 🧪 Verification & Testing

CollabSpace includes a robust, automated test suite covering unit tests, security audits, and multi-viewport end-to-end flows:

```bash
# Run unit and integration tests (74 passing tests)
npm test

# Run the 17-point automated security audit
node scripts/test_security_audit.js

# Run Playwright end-to-end tests
npm run test:e2e

# Build production bundle with zero compilation errors
npm run build
```

<details>
<summary><b>View Automated Test Suite Breakdown</b></summary>

```
Test Files  9 passed (9)
     Tests  74 passed (74)
   Results  100% Passing

 ✓ src/test/collaboration.test.js  (12 tests) - CRDT document merging & presence
 ✓ src/test/tasks.test.js          (11 tests) - Task CRUD & status transitions
 ✓ src/test/files.test.js          (8 tests)  - File validation & upload flows
 ✓ src/test/workspaces.test.js     (8 tests)  - Multi-tenant workspace RBAC
 ✓ src/test/ui-components.test.jsx (8 tests)  - Button, Input, Modal, Badge
 ✓ src/test/projects.test.js       (7 tests)  - Project lifecycle & member assign
 ✓ src/test/analytics.test.js      (7 tests)  - Real-time KPI calculations
 ✓ src/test/auth.test.js           (7 tests)  - Rate limiting & input handling
 ✓ src/test/realtime.test.js       (6 tests)  - Presence & WebSocket events
```

</details>

---

## 🗺️ Key Routes Map

| Route Path | View Purpose | Protection Level |
| :--- | :--- | :---: |
| `/` | Interactive SaaS Landing Page & Pricing | **Public** |
| `/login` | User Authentication Portal | **Public Only** |
| `/register` | Team Sign-Up Flow | **Public Only** |
| `/dashboard` | Authenticated User Overview Hub | **Protected** |
| `/admin` | Dedicated Single Super Admin Portal | **Super Admin Gate** |
| `/projects` | Workspace Projects & Deadlines | **Protected** |
| `/tasks` | Interactive Drag-and-Drop Kanban Board | **Protected** |
| `/chat` | Real-Time Project Messaging Channels | **Protected** |
| `/docs` | Real-Time CRDT Collaborative Docs | **Protected** |
| `/whiteboards` | Collaborative Brainstorming Canvas | **Protected** |
| `/analytics` | Dynamic KPI Charts & Member Workloads | **Protected** |
| `/settings` | User Profile & Security Configuration | **Protected** |
| `/privacy`, `/terms` | Legal Policies & DPDP Act Compliance | **Public** |

---

## 🤝 Contributing to CollabSpace

CollabSpace is completely **open source**! We warmly welcome contributors from all backgrounds and experience levels to help build the modern operating system for real-time teams.

### Ways to Get Involved:
- 🐛 **Report Bugs**: Discover a glitch or edge-case? Open a [Bug Report](https://github.com/roshangowdas/CollabSpace/issues/new?template=bug_report.md).
- 💡 **Propose Features**: Have an idea for Kanban, CRDT Docs, Whiteboards, or Chat? Submit a [Feature Request](https://github.com/roshangowdas/CollabSpace/issues/new?template=feature_request.md).
- 🛠️ **Solve Open Issues**: Check out issues labeled `good first issue` or `help wanted`, comment to claim them, code your fix, and submit a Pull Request.
- 📖 **Improve Documentation**: Help clarify setup instructions, code comments, or architecture diagrams.

```bash
# Quick Contributor Workflow:
1. git clone https://github.com/<YOUR_USERNAME>/CollabSpace.git
2. npm install
3. cp .env.example .env     # Add your Supabase credentials
4. npm run dev             # Frontend on localhost:5173
5. npm test                # Verify all 74 unit tests pass
```

> 📘 **Detailed Contributing Guide**:  
> Please read our full [**CONTRIBUTING.md**](CONTRIBUTING.md) (or [**contribute.md**](contribute.md)) for code style conventions, Hoy Design System tokens, Supabase Row-Level Security (RLS) standards, and PR checklists.

---

## 📄 License & Attribution

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with precision for high-velocity software teams. Designed with the Hoy aesthetic.</sub>
</div>

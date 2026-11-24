# Contributing to CollabSpace 🤝

First of all, thank you for considering contributing to **CollabSpace**! 🎉

CollabSpace is an open-source, production-grade real-time team collaboration SaaS built with **React 18, Vite, Supabase, Tailwind CSS, and the Hoy Design System**. Whether you are fixing a typo in the docs, reporting a bug, optimizing performance, proposing a new feature, or building a full sprint kanban enhancement, your contributions are warmly welcomed and greatly appreciated!

---

## 📑 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How You Can Contribute](#-how-you-can-contribute)
- [Finding an Issue to Work On](#-finding-an-issue-to-work-on)
- [Reporting Issues & Bugs](#-reporting-issues--bugs)
- [Suggesting Enhancements](#-suggesting-enhancements)
- [Development Setup](#-development-setup)
- [Contribution Workflow (Fork & PR Guide)](#-contribution-workflow-fork--pr-guide)
- [Coding & Architectural Standards](#-coding--architectural-standards)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Commit Convention](#-commit-convention)
- [Submitting a Pull Request](#-submitting-a-pull-request)
- [Community & Support](#-community--support)

---

## 📜 Code of Conduct

We are dedicated to providing a welcoming, diverse, and harassment-free experience for everyone. When participating in this project:

- **Be respectful and inclusive**: Treat fellow contributors, maintainers, and community members with empathy and constructive kindness.
- **Focus on constructive feedback**: Critique code and architecture objectively, never people.
- **Respect differing perspectives**: Welcome newcomers, accommodate different backgrounds and experience levels.

---

## 🚀 How You Can Contribute

You don't have to write thousands of lines of code to make a huge impact! Here are some of the many ways you can contribute:

| Area | What You Can Do |
| :--- | :--- |
| 🐛 **Bug Fixes** | Discover a bug? Report it with reproducible steps or fix it and submit a PR! |
| 💡 **Features** | Propose, design, or implement enhancements to Kanban, Docs, Whiteboards, or Chat. |
| 📖 **Documentation** | Clarify the README, write setup guides, improve code comments, or document architecture. |
| 🧪 **Tests & QA** | Expand our Vitest unit test suite or Playwright end-to-end tests to harden reliability. |
| 🎨 **UI / UX Polish** | Refine accessibility (a11y), responsive mobile behaviors, or Hoy design tokens. |
| 🛡️ **Security** | Audit Supabase Row-Level Security (RLS) policies, rate limits, or input sanitization. |

---

## 🎯 Finding an Issue to Work On

Check out our [GitHub Issues](https://github.com/roshangowdas/CollabSpace/issues) tab! We label issues to make it easy to find what suits your interests:

- `good first issue`: Ideal for newcomers looking to make their first open-source contribution.
- `help wanted`: Complex or high-value features where community help is actively requested.
- `bug`: Something that isn't working as expected.
- `enhancement`: New features or architectural improvements.
- `documentation`: README, code docstrings, and setup improvements.

> 💡 **Tip**: Before starting work on an existing issue, please drop a comment on the issue saying:
> *"I'd like to work on this issue! Please assign it to me."*
> This prevents multiple contributors from working on the same task simultaneously.

---

## 🐛 Reporting Issues & Bugs

If you find a bug in CollabSpace, please file an issue using our **Bug Report** template:

1. **Search existing issues** first to make sure it hasn't already been reported.
2. Provide a **clear and descriptive title**.
3. Include **step-by-step instructions** to reproduce the bug.
4. Describe the **expected behavior** versus the **actual behavior**.
5. Mention your **environment**: OS, Browser (Chrome, Safari, Firefox), and screen resolution.
6. Attach **screenshots, screen recordings, or browser console error logs** if applicable.

---

## 💡 Suggesting Enhancements

Have an idea for a great new feature? We'd love to hear it!

1. Open a new issue with the `[Feature Request]` label.
2. Clearly describe the problem your feature solves or the workflow it empowers.
3. Outline your proposed solution, UI design thoughts, or database implications.
4. Discuss with maintainers before opening a large Pull Request to ensure alignment with project roadmap and design goals.

---

## 💻 Development Setup

Follow these steps to get CollabSpace running locally on your computer:

### 1. Prerequisites

Make sure you have installed:
- **Node.js**: `v18.x` or `v20.x` or later ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.x` or later (bundled with Node)
- **Git**: ([Download Git](https://git-scm.com/))
- A free **Supabase** account ([supabase.com](https://supabase.com))

### 2. Fork and Clone

1. Fork the repository by clicking the **Fork** button at the top-right of [roshangowdas/CollabSpace](https://github.com/roshangowdas/CollabSpace).
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/CollabSpace.git
   cd CollabSpace
   ```

3. Add the upstream remote to stay synchronized with original repository:
   ```bash
   git remote add upstream https://github.com/roshangowdas/CollabSpace.git
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_HOCUSPOCUS_URL=ws://localhost:1234
   ```

> ⚠️ **IMPORTANT**: Never commit your `.env` file or expose secret `service_role` keys. Only `VITE_` prefixed public environment variables should be used on the client.

### 5. Launch the Development Server

Start the Vite development server:
```bash
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 6. (Optional) Run the Collaborative Docs CRDT Server

If you are working on real-time document editing (`/docs`):
```bash
npm run server
```
This boots the standalone Node.js Hocuspocus WebSocket server on port `1234`.

---

## 🔄 Contribution Workflow (Fork & PR Guide)

Here is the step-by-step lifecycle of a CollabSpace contribution:

```
[Fork Repo] ──► [Create Branch] ──► [Code & Test] ──► [Commit] ──► [Push] ──► [Open PR]
```

### Step 1: Keep Your Fork Updated
Before starting a new feature or fix, pull the latest changes from upstream:
```bash
git checkout main
git pull upstream main
```

### Step 2: Create a Descriptive Topic Branch
Create a new branch with a prefix matching your contribution:
```bash
# For a new feature:
git checkout -b feature/kanban-swimlanes

# For a bug fix:
git checkout -b fix/chat-scroll-anchor

# For documentation:
git checkout -b docs/update-contributing-guide

# For tests:
git checkout -b test/whiteboard-shapes
```

### Step 3: Implement Your Changes
- Make your code edits cleanly following the [Coding Standards](#-coding--architectural-standards).
- Keep pull requests focused on a single logical change or issue. Avoid mixing multiple unrelated changes.

### Step 4: Run the Test Suite
Ensure all existing tests pass and add new tests if applicable:
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Step 5: Commit Your Work
Follow the [Conventional Commits](#-commit-convention) specification:
```bash
git add .
git commit -m "feat(kanban): add drag-and-drop column swimlanes"
```

### Step 6: Push to Your Fork
```bash
git push origin feature/kanban-swimlanes
```

### Step 7: Open a Pull Request
1. Navigate to the original [roshangowdas/CollabSpace](https://github.com/roshangowdas/CollabSpace) repository.
2. GitHub will prompt you with a **"Compare & pull request"** banner. Click it!
3. Fill out the Pull Request template thoroughly.
4. Reference any linked issues in the PR body (e.g., `Closes #42` or `Fixes #18`).
5. Submit the PR and wait for maintainer review.

---

## 📐 Coding & Architectural Standards

To maintain high software craftsmanship, CollabSpace follows strict guidelines:

### 1. Language & Framework Rules
- **JavaScript Only**: Do not use TypeScript (`.jsx` / `.js` only).
- **Functional Components**: Use standard React functional components with hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, custom hooks).
- **No Monoliths**: Never put all logic into `App.jsx`. Keep components modular and reusable.
- **Project Structure**:
  ```
  src/
  ├── components/       # Reusable UI & view components
  │   ├── admin/        # Super Admin portal views
  │   ├── chat/         # Messaging & channel components
  │   ├── docs/         # CRDT document editor
  │   ├── kanban/       # Task boards & dnd-kit columns
  │   ├── presence/     # Real-time online avatars & pills
  │   ├── ui/           # Atomic buttons, modals, badges, inputs
  │   └── whiteboard/   # Infinite canvas brainstorming
  ├── contexts/         # React Context providers (Auth, Workspace, Presence)
  ├── hooks/            # Custom reusable hooks
  ├── integrations/     # Supabase client, queries, and authUtils
  ├── lib/              # Utility helpers, classnames (cn)
  ├── services/         # External APIs, rate limiters, security guards
  ├── test/             # Vitest unit & integration test suites
  └── utils/            # Pure helper functions & math algorithms
  ```

### 2. Styling & The Hoy Design System
CollabSpace implements a tailored **Hoy Design System** aesthetic:
- **Base Palette**: Warm dark background (`#191918` / `#120d0f`), card surface (`#222221`), light text (`#ECECEA`), muted text (`#A5A5A4`), and crimson/amber accents (`#EB1B38` / `#f59e0b`).
- **Micro-Radii**: Standard `6px` border radii (`rounded-[6px]`). Avoid pill buttons where sharp SaaS cards fit best.
- **Restraint**: Avoid gratuitous glassmorphism, heavy rainbow gradients, or generic AI styling. Keep interfaces crisp, fast, and legible.
- **Responsiveness**: Ensure layouts look great across mobile (< 640px), tablet (640-1024px), and wide desktop displays (> 1024px).

### 3. Supabase & Security Rules
- **Official SDK**: Always interact with the database via the official `@supabase/supabase-js` client.
- **Row-Level Security (RLS)**: Every new database table must have RLS enabled with explicit tenant isolation policies (`workspace_id` verification).
- **Client-Side Authorization**: Never rely solely on frontend role checks (`isAdmin`). Always pair frontend UI gating with Supabase RLS policies.
- **Form Validation**: Always validate user input using `react-hook-form` and `zod` schemas. Include clean loading, error, and empty states.
- **Zero Leaks**: Never expose or commit `service_role` keys or secret API tokens.

---

## 🧪 Testing & Quality Assurance

Quality is a core pillar of CollabSpace. We maintain a 100% passing test matrix:

```bash
# Run unit test suite with Vitest
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run Playwright E2E browser tests (requires built app)
npm run test:e2e

# Run all test suites combined
npm run test:all
```

When contributing:
- Existing tests **must not break**.
- If you fix a bug, please add a regression test confirming the bug stays fixed.
- If you introduce a new feature, write corresponding unit tests in `src/test/`.

---

## 📝 Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) convention to produce a clean, automated changelog:

```
<type>(<scope>): <subject>
```

### Common Types:
- `feat`: A new user-facing feature (e.g., `feat(kanban): add task export to CSV`)
- `fix`: A bug fix (e.g., `fix(chat): prevent double message submission on Enter`)
- `docs`: Documentation-only changes (e.g., `docs(readme): add troubleshooting section`)
- `style`: Changes that do not affect code logic (formatting, whitespace)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding missing tests or correcting existing tests
- `perf`: A code change that improves execution performance
- `chore`: Changes to build process, dependencies, or auxiliary tools

---

## 📬 Submitting a Pull Request

When your code is ready:
1. Open a PR against the `main` branch.
2. Fill out the **PR Template** completely:
   - Summary of changes
   - Motivation and context
   - How this was tested
   - Screenshots / GIFs (especially for UI changes)
3. Ensure all automated GitHub Action checks pass.
4. Maintainers will review your PR and may suggest improvements or approve the merge.
5. Once approved, your PR will be squash-merged into `main` and your name will be added to the project contributors! 🎉

---

## 💬 Community & Support

Have questions or need help while working on a contribution?

- **GitHub Issues**: Open an issue for bugs or enhancements.
- **Discussions**: Start an open conversation about ideas or architecture.
- **Direct Contact**: Reach out to the maintainer at `0243roshan@gmail.com` or connect on [LinkedIn](https://www.linkedin.com/in/roshan-gowda-s-378343283/).

Thank you for helping make CollabSpace better for teams worldwide! ✨

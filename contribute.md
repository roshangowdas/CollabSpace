# Contributing to CollabSpace 🤝

Welcome! CollabSpace is an open-source real-time team collaboration SaaS. We welcome all community members to report issues, suggest improvements, solve open tickets, and submit pull requests (PRs).

> 📘 **Looking for the full, detailed contribution manual?**  
> Check out the complete [**CONTRIBUTING.md**](CONTRIBUTING.md) guide for comprehensive architecture rules, Supabase RLS security, and test guidelines.

---

## ⚡ Quick Contribution Guide in 5 Steps

```
1. Find / Report Issue ──► 2. Fork & Clone ──► 3. Code & Test ──► 4. Commit ──► 5. Send PR
```

### 1. Find or Report an Issue
- Browse existing open issues on [GitHub Issues](https://github.com/roshangowdas/CollabSpace/issues).
- Look for tags like `good first issue`, `help wanted`, or `bug`.
- Want to solve an issue? Drop a quick comment: *"I'd like to work on this! Please assign it to me."*
- Found a bug? Open a new issue with steps to reproduce and screenshots.

### 2. Fork and Clone
```bash
# 1. Fork on GitHub, then clone your fork:
git clone https://github.com/<YOUR_USERNAME>/CollabSpace.git
cd CollabSpace

# 2. Add upstream to stay up to date:
git remote add upstream https://github.com/roshangowdas/CollabSpace.git

# 3. Install packages:
npm install

# 4. Set up environment:
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Create a Branch & Code
```bash
# Always branch off the latest main:
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```
- **Language**: JavaScript only (`.jsx` / `.js`).
- **Styling**: Tailwind CSS + Hoy Design System tokens (`#191918` dark background, `#ECECEA` text, `6px` radii).
- **Architecture**: Keep UI components, hooks, contexts, and Supabase services cleanly separated.
- **Security**: Never expose `service_role` keys. Enforce Supabase Row-Level Security (RLS) on all database tables.

### 4. Verify & Run Tests
Make sure the test suite passes with zero errors:
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

### 5. Commit and Send a PR
```bash
# Follow Conventional Commits:
git add .
git commit -m "feat(kanban): add custom column tags"
git push origin feature/your-feature-name
```
- Go to [roshangowdas/CollabSpace](https://github.com/roshangowdas/CollabSpace) on GitHub.
- Click **"Compare & pull request"**.
- Describe what you built, attach screenshots/GIFs for UI changes, and reference the issue: `Closes #123`.
- Submit your PR! Our maintainers will review and merge it.

---

For in-depth details on coding standards, testing suites, commit formats, and security policies, please see the complete [**CONTRIBUTING.md**](CONTRIBUTING.md).

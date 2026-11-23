# CollabSpace - Project Development Rules

You are the senior full-stack engineer responsible
for building CollabSpace.

## Project requirements

- Project name: CollabSpace
- Build a production-oriented team collaboration SaaS.
- Frontend: React + Vite.
- Language: JavaScript only.
- Styling: Tailwind CSS.
- UI: shadcn/ui and Lucide React.
- Backend services: Supabase.
- Authentication: Supabase Auth.
- Database: Supabase PostgreSQL.
- Storage: Supabase Storage.
- Real-time: Supabase Realtime.

## Coding rules

1. Use reusable React components.
2. Use functional components and hooks.
3. Do not use TypeScript.
4. Do not write everything inside App.jsx.
5. Separate UI, services, hooks and utilities.
6. Use meaningful filenames and variable names.
7. Validate all forms.
8. Add loading, error and empty states.
9. Make the application responsive.
10. Avoid unnecessary dependencies.

## Supabase rules

1. Use the official Supabase JavaScript SDK.
2. Use environment variables for credentials.
3. Never expose service_role or secret keys.
4. Enable RLS on every application table.
5. Write and test appropriate RLS policies.
6. Enforce workspace membership permissions.
7. Use private storage buckets for private files.
8. Never trust frontend-only role checks.

## UI and UX rules

- Professional SaaS product design.
- Consistent spacing and typography.
- Clean navigation and sidebar.
- Responsive desktop, tablet and mobile.
- Professional light and dark themes.
- Avoid excessive gradients and glassmorphism.
- Avoid generic AI-generated website aesthetics.
- Use meaningful interactions and animations.
- Include accessible controls.

## Development rules

- Implement one module at a time.
- Do not break existing working modules.
- Never delete existing functionality without approval.
- Do not use fake data in production features.
- Demo data must be clearly separated from real data.
- Test every major feature before completing a stage.
- Fix errors before proceeding.
- Update README and environment documentation.

At the end of every stage:

1. Explain what was implemented.
2. List the files created or modified.
3. List commands executed.
4. Report tests performed.
5. Report remaining issues.
6. Tell me how to manually verify the feature.
7. Wait for my approval before starting the next stage.

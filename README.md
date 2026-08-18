# PixelForge

A collaborative project workspace for a small team — Jira/Linear-style issue tracking,
Kanban boards, sprints, epics, and real-time collaboration — built for managing
software, FiveM, and personal projects with friends.

## Stack

- **Next.js 16** (App Router, TypeScript) behind a **custom Node server** (`server.ts`) so **Socket.IO** can share the same HTTP server for real-time updates
- **PostgreSQL** (tested against Neon) + **Prisma 6**
- **Auth.js v5** (Credentials provider, bcrypt, JWT sessions)
- **Tailwind CSS v4** with a custom design system (no default shadcn look)
- **TanStack Query** (server state) + **Zustand** (small bits of client UI state)
- **@dnd-kit** (Kanban drag-and-drop), **react-hook-form + zod**, **cmdk** (command palette)

## Running locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up the database.** Create a Postgres database (e.g. a free [Neon](https://neon.tech) project) and copy `.env.example` to `.env`, filling in:

   ```
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   AUTH_SECRET="<generate with: npx auth secret>"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Push the schema**

   ```bash
   npx prisma db push
   ```

4. **Seed realistic development data** (optional but recommended)

   ```bash
   npm run db:seed
   ```

   Creates a "PixelForge" workspace with 3 projects (FDJ, ALO, PORT), 6 users, 30+ issues,
   epics, sprints (one completed, two active), subtasks, comments, and notifications.
   Every seeded account logs in with the same password: `password123`. Login as
   `karthik@pixelforge.dev` to see the workspace as its owner.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Registering a new account instead
   of using seed data will land you on `/workspaces/new` to create your own workspace.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (custom server + Socket.IO, Turbopack) |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npm test` | Run the Vitest suite (hits the real database — see below) |
| `npm run db:push` | Push `prisma/schema.prisma` to the database |
| `npm run db:migrate` | Create a dev migration |
| `npm run db:seed` | Reset and re-seed development data |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

- `app/` — routes. `(auth)/` for logged-out pages, `(app)/[workspaceSlug]/...` for the
  authenticated app shell, `api/**` for Route Handlers.
- `lib/services/*.ts` — all business logic and authorization lives here. Route handlers
  are thin: validate input with zod, call a service, return JSON. Server Components call
  the same services directly (no internal HTTP round-trip).
- `lib/authz.ts` — `requireWorkspaceRole` / `requireProjectAccess` / `requireIssueAccess`
  are called at the top of every service function that touches data, so authorization is
  enforced server-side regardless of which client called it.
- `components/` — `ui/` (design-system primitives), then feature folders (`issues/`,
  `board/`, `backlog/`, `dashboard/`, etc.).
- `hooks/` — TanStack Query hooks per resource, with Socket.IO listeners patching the
  cache for real-time updates.
- `server.ts` — custom Node server wrapping Next.js + Socket.IO. `lib/socket-server.ts`
  holds the `io` singleton so API route handlers (same process) can emit to rooms.

## Testing

`npm test` runs Vitest against the **real** database configured in `.env` — it creates
its own isolated users/workspaces (unique per run) and tears them down in `afterAll`, so
it's safe to run repeatedly without a separate test database. Coverage: registration and
duplicate-account rejection, workspace/project authorization isolation, issue CRUD and
assignment, project membership, the full sprint lifecycle (start/complete, including
incomplete issues rolling back to the backlog), and search (by issue key and text).

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | `npx auth secret` to generate one |
| `NEXTAUTH_URL` | Yes | Base URL of the app (`http://localhost:3000` locally) |
| `PORT` | No | Defaults to 3000 |

## Known limitations

- **No outbound email.** No SMTP/email provider is configured. Password-reset links are
  written to the **server console** instead of emailed (returning them over HTTP would let
  anyone reset any account just by knowing its email). Workspace invitations work entirely
  in-app (an invite link + in-app notification), no email is sent either. Wiring up
  Resend/SMTP is a natural next step.
- **File attachments live on local disk** (`/uploads`, gitignored). Fine for self-hosting
  this for a friend group; swap for S3-compatible storage before deploying anywhere
  serverless/ephemeral.
- **Real-time requires a persistent Node process** (the custom server + Socket.IO), so this
  isn't a fit for Vercel-style serverless deployment as-is — deploy it to a host that runs
  a long-lived process (Render, Railway, Fly.io, a VPS).
- **`ProjectMember.role`** (Lead/Member/Viewer) is stored but not yet enforced anywhere —
  authorization is currently gated entirely by **workspace** role (Owner/Admin/Member/Guest).
  A Viewer today has the same effective permissions as a Member.
- Command palette search is keyword/substring matching, not natural-language.

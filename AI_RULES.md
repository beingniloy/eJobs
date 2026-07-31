# AI_RULES.md

## Tech Stack

- **Next.js 16** (App Router) with standalone output for Docker deployment
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS v4** for all styling — no inline styles, no CSS modules, no styled-components
- **shadcn/ui** component library (Radix UI primitives) for all UI primitives
- **TanStack React Query** for all server state (fetching, caching, mutations)
- **Zustand** for global client state only (auth, notifications, theme)
- **React Hook Form + Zod** for all form handling and validation
- **Axios** via `src/lib/api-client.ts` for HTTP requests to the Laravel backend
- **TipTap** for rich text editing
- **Laravel Echo + Pusher** for real-time events (WebSocket)
- **Laravel backend** — this is a frontend-only repo; API proxied via Next.js rewrites

## Routing & File Structure

- All routes live in `src/app/` using Next.js App Router conventions
- Route groups: `(auth)`, `(dashboard)`, `(employer)` — no URL segment added
- Pages use `page.tsx`, layouts use `layout.tsx`
- Client components: suffix with `Client.tsx` (e.g., `LoginClient.tsx`)
- Path alias: `@/*` → `./src/*`

## Library Usage Rules

### UI Components
- **shadcn/ui** for ALL reusable UI primitives (Button, Dialog, Input, Select, Table, Tabs, etc.)
- Import from `@/components/ui/` — never modify shadcn files; create new components if customization needed
- `cn()` utility from `@/lib/utils` for conditional class merging (always use instead of manual template strings)
- **lucide-react** for all icons — no other icon library

### Forms
- **React Hook Form** (`useForm`, `useFieldArray`) for all forms
- **Zod** schemas for validation — co-locate schemas with the form component
- `@hookform/resolvers` for zod integration

### State Management
- **TanStack React Query** for API data — `useQuery`, `useMutation`, `useInfiniteQuery`
- **Zustand** stores only for cross-cutting client state: auth session, notification badge, theme preference
- Never store API response data in Zustand — use React Query cache instead

### HTTP Requests
- Always use the Axios instance from `@/lib/api-client.ts`
- Service files in `src/services/` wrap API calls — add new endpoints there
- No raw `fetch()` calls for API data

### Styling
- **Tailwind CSS v4** exclusively — no CSS modules, no styled-components, no inline `style={{}}`
- Use `cn()` to merge Tailwind classes, especially for conditional/dynamic styles
- Theme tokens via CSS custom properties in `globals.css`

### Rich Text / Markdown
- **TipTap** for any editable rich text input
- **react-markdown + remark-gfm** for rendering markdown content (read-only)

### Real-Time
- **Laravel Echo + Pusher** for WebSocket connections — config in `src/lib/echo.ts`

### Dates
- Use `Intl.DateTimeFormat` or `date-fns` for date formatting
- Timezone-aware formatting via `@/lib/utils` helpers

### Sanitization
- **DOMPurify / isomorphic-dompurify** for sanitizing any user-generated HTML before rendering

## Code Conventions

- All files in `src/` — never create files outside `src/` except config files
- Components → `src/components/`
- Pages → `src/app/`
- Hooks → `src/hooks/`
- Services → `src/services/`
- Stores → `src/store/`
- Types → `src/types/`
- Lib/utils → `src/lib/`
- Providers → `src/providers/`
- Use `'use client'` directive only when component needs browser APIs, event handlers, or hooks with side effects
- Prefer Server Components by default; add `'use client'` only when necessary

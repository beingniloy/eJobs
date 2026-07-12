# eJobs - Frontend

> Next.js 16 + Tailwind CSS 4 frontend for the [eJobs](https://ejobs.bd) job portal.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** Tailwind CSS 4, shadcn/ui, Radix UI, Lucide icons
- **State:** Zustand (persist), React Query (server state)
- **Auth:** Laravel Sanctum (Bearer tokens)
- **Forms:** React Hook Form + Zod validation
- **Realtime:** Laravel Echo + Reverb (WebSocket)
- **Language:** TypeScript 6

## Getting Started

```bash
# Clone
git clone https://github.com/nextinbd/eJobs.git
cd eJobs

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your API URL

# Develop
npm run dev        # http://localhost:3000

# Build
npm run build

# Lint
npm run lint
```

## Environment Variables

| Variable               | Description             | Default                 |
| ---------------------- | ----------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`  | Laravel backend API URL | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_APP_NAME` | Application name        | `eJobs`                 |
| `NEXT_PUBLIC_APP_URL`  | Frontend URL            | `http://localhost:3000` |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (login, register, forgot-password)
│   ├── (dashboard)/        # Candidate dashboard
│   ├── (employer)/         # Employer dashboard
│   ├── ai-assistant/       # AI career chat
│   ├── companies/          # Company listings
│   ├── jobs/               # Job listings & detail
│   ├── cv/                 # CV preview
│   ├── resume-builder/     # CV builder
│   └── layout.tsx          # Root layout (providers, metadata)
├── components/
│   ├── auth/               # Social login buttons
│   ├── cv/                 # CV builder components
│   ├── jobs/               # Job-related components
│   ├── layout/             # Navbar, Footer, PublicLayout
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Custom React hooks
├── lib/                    # API client, utilities
├── providers/              # Auth, Query, Theme providers
├── services/               # API service layer
├── store/                  # Zustand stores
└── types/                  # TypeScript interfaces
```

## Key Pages

| Route             | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `/`               | Homepage with job search, categories, companies      |
| `/jobs`           | Job listings with filters                            |
| `/jobs/[id]`      | Job detail with JSON-LD structured data              |
| `/companies`      | Company directory                                    |
| `/resume-builder` | AI-powered CV builder with template marketplace      |
| `/ai-assistant`   | AI career chat assistant                             |
| `/pricing`        | Subscription plans                                   |
| `/dashboard`      | Candidate dashboard (applied jobs, wallet, messages) |
| `/employer/*`     | Employer dashboard (post jobs, candidates, wallet)   |

## Docker Deployment

```bash
docker build -t ejobs-frontend .
docker run -p 3000:3000 ejobs-frontend
```

The Dockerfile uses multi-stage build with `node:22-alpine` and `output: standalone`.

## License

Proprietary — [Nextin BD](https://nextinbd.com)

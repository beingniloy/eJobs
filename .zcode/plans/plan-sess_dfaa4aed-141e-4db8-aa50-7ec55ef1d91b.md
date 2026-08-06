# Performance Optimization Plan

## Root Cause Analysis

### 1. `export const dynamic = "force-dynamic"` in root layout (CRITICAL)
**File:** `src/app/layout.tsx:6`
- Forces ALL pages to be dynamically rendered on every request
- Defeats Next.js static generation, ISR, streaming, edge caching
- This single line is the #1 performance killer

### 2. Blocking SEO fetch on every page load
**File:** `src/app/layout.tsx:27-49`
- `fetchSeoSettings()` runs on every page with 5s timeout
- Has `revalidate: 300` but `force-dynamic` defeats the cache
- After removing `force-dynamic`, this auto-fixes via ISR

### 3. Homepage 100% client-rendered (HIGH)
**File:** `src/app/page.tsx` (1434 lines, `"use client"`)
- All 45+ lucide icons imported eagerly
- District data hardcoded inline (~100 lines)
- 6 API calls on mount with raw `fetchWithRetry` — no React Query caching
- `fetchWithRetry` re-fetches everything on every visit

### 4. No code splitting on heavy pages (MEDIUM)
- `resume-builder` imports tiptap (~200KB) eagerly
- `ai-assistant` imports react-markdown + remark-gfm eagerly
- Only `RichTextEditor` uses `next/dynamic` already

### 5. Auth verification blocks render (MEDIUM)
**File:** `src/providers/auth-provider.tsx`
- `api.get("/user")` runs on every page load
- Already has `enabled: !!token && !user` — only fires when no cached user
- React Query `staleTime: 5min` already set — this is OK

### 6. Navbar makes API calls on mount (LOW-MEDIUM)
**File:** `src/components/layout/Navbar.tsx`
- Subscription + notification fetches on every page
- No staleTime — refetches constantly

---

## Execution Steps

### Step 1: Remove `force-dynamic` from root layout
**File:** `src/app/layout.tsx`
- Delete line 6: `export const dynamic = "force-dynamic";`
- Enables ISR caching for SEO fetch (5min) and all server components

### Step 2: Extract district data from homepage
**File:** `src/app/page.tsx` → NEW `src/data/bangladesh-districts.ts`
- Move `DIVISIONS_BN`, `DIVISIONS_EN`, `DISTRICTS_BN`, `DISTRICTS_EN` to separate file
- Reduces homepage bundle parse cost

### Step 3: Extract icon map from homepage  
**File:** `src/app/page.tsx` → NEW `src/app/homepage-icons.ts`
- Move the `ICON_MAP` object and icon imports to separate file
- Wrap with `React.memo` to prevent re-renders

### Step 4: Add React Query caching for homepage
**File:** `src/app/page.tsx`
- Replace raw `fetchWithRetry` + `useState` with `useQuery`
- Set `staleTime: 2 * 60 * 1000` (2 min)
- Prevents refetching on navigation back

### Step 5: Dynamic import heavy pages
**Files:**
- `src/app/resume-builder/page.tsx` → wrap with `next/dynamic`
- `src/app/ai-assistant/page.tsx` → wrap with `next/dynamic`
- Defers tiptap + react-markdown (~250KB) until needed

### Step 6: Fix Navbar staleTime
**File:** `src/components/layout/Navbar.tsx`
- Move subscription fetch to React Query with `staleTime: 5 * 60 * 1000`

---

## Files Modified
1. `src/app/layout.tsx` — remove `force-dynamic`
2. `src/app/page.tsx` — lazy icons, extract districts, React Query
3. `src/data/bangladesh-districts.ts` — NEW
4. `src/app/homepage-icons.ts` — NEW
5. `src/app/resume-builder/page.tsx` — dynamic import
6. `src/app/ai-assistant/page.tsx` — dynamic import
7. `src/components/layout/Navbar.tsx` — React Query for subscription

## Expected Impact
- **First load:** ~40-60% faster (ISR caching + code splitting)
- **Subsequent loads:** Near-instant (ISR + React Query cache)
- **Bundle:** ~250KB reduction (tiptap, react-markdown deferred)
- **Time to Interactive:** Major improvement on homepage and public pages
# PWA Footer Install Banner

## Problem
No PWA install option in footer. Existing `PwaInstallBanner` is a floating bottom-right popup — user wants a persistent footer section similar to Play Store app banners.

## Plan

### Step 1: Create shared `usePwaInstall` hook
**File:** `src/hooks/use-pwa-install.ts` (NEW)

Extract `beforeinstallprompt` logic into a shared hook so both Footer and existing PwaInstallBanner can use it without duplicating event listeners.

```typescript
export function usePwaInstall() {
  // Listens to beforeinstallprompt, appinstalled, standalone detection
  // Returns: { canInstall, install(), isInstalled }
}
```

### Step 2: Add PWA install section to Footer
**File:** `src/components/layout/Footer.tsx`

Add a section above the bottom bar (between grid and copyright) with:
- App icon: `settings.site_logo` via `getStorageUrl()` → `<Image>` fallback to `/favicon.svg`
- App name from `settings.site_name`
- Tagline (bilingual)
- "Install App" button that triggers `install()`
- Only renders when `canInstall && !isInstalled`
- Dismiss button → stored in `localStorage` (`pwa-footer-dismissed`), reappears after 7 days

Visual: horizontal card with icon left, text center, button right — like Google Play Store footer banners.

### Step 3: Refactor existing `PwaInstallBanner` to use shared hook
**File:** `src/components/pwa-install-banner.tsx`

Replace inline `beforeinstallprompt` logic with `usePwaInstall()` hook. Keeps the floating bottom-right behavior but deduplicates event listeners.

### Step 4: Generate PNG icons for PWA manifest
**File:** `public/favicon-192.png`, `public/favicon-512.png` (NEW)

The manifest only references SVG which doesn't work on all platforms. Create PNG versions from the existing SVG favicon. Update `src/app/manifest.json/route.ts` fallback to include PNG icon references.

## Files Modified
1. `src/hooks/use-pwa-install.ts` — NEW shared hook
2. `src/components/layout/Footer.tsx` — add install banner section
3. `src/components/pwa-install-banner.tsx` — refactor to use shared hook
4. `src/app/manifest.json/route.ts` — add PNG icon references to fallback
5. `public/favicon-192.png`, `public/favicon-512.png` — NEW generated icons

## UX
- Footer banner: persistent, professional, like Play Store banners
- Floating banner: still works as-is (just deduped via shared hook)
- Both respect dismiss state (footer uses localStorage with 7-day expiry, floating uses sessionStorage)
- Only shows when PWA is actually installable (beforeinstallprompt fired)
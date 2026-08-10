# Settings Page UI Redesign

## Current State
- Flat vertical stack of 4 cards: Appearance, Language, Account, TwoFactorSettings
- `max-w-2xl` container, `space-y-6`
- No tabs, no visual hierarchy — everything at same level
- Theme toggle uses 3 buttons side-by-side
- Account card just shows email + logout button
- 2FA component dumped at bottom as separate card

## Target
Compact, professional, responsive settings with clear visual hierarchy.

## Design Approach

**Single card with sectioned rows** — no tabs needed for 4 sections. Use one Card with internal sections separated by `Separator`, each row using a consistent icon + label + control pattern.

### Layout
```
┌─────────────────────────────────────────────┐
│ ⚙ Settings                                 │
├─────────────────────────────────────────────┤
│ 🌗 Appearance        [Light] [Dark] [System]│
│ ─────────────────────────────────────────── │
│ 🌐 Language          [English] [বাংলা]       │
│ ─────────────────────────────────────────── │
│ 👤 Account           user@email.com         │
│ ─────────────────────────────────────────── │
│ 🛡 Two-Factor Auth   ● Active  [Manage]     │
│ ─────────────────────────────────────────── │
│                        [🚪 Logout]          │
└─────────────────────────────────────────────┘
```

### Key Changes
1. **Single card** instead of 4 separate cards — more compact
2. **Section rows**: icon (in rounded bg) + label + description + control (right-aligned)
3. **2FA summary row** with status badge + "Manage" button that expands/toggles the full 2FA component inline
4. **Responsive**: On mobile, controls stack below labels. On desktop, icon | text | control in a row.
5. **Logout** at bottom as a full-width destructive button, separated by `Separator`
6. Keep `max-w-2xl` container, `space-y-6` page wrapper

### Files to Change
1. **`src/app/(dashboard)/dashboard/settings/page.tsx`** — Full rewrite of the settings page layout
2. No changes to `two-factor-settings.tsx` — it stays as-is but is now conditionally rendered when user clicks "Manage"

### Implementation Details

**Section Row Component** (inline, not extracted — single file):
```
<div className="flex items-center justify-between gap-4 py-3">
  <div className="flex items-center gap-3">
    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
  <div className="shrink-0">{control}</div>
</div>
```

**Responsive behavior**:
- `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3` on each row
- On mobile: label on top, controls below
- On desktop (sm+): label left, controls right

**2FA section**: Show a summary row with status badge. Clicking "Manage" toggles visibility of the full `<TwoFactorSettings />` component below the row (with a slide-down animation or just conditional render).

**Theme buttons**: Keep the 3-button group but make them more compact with `size="sm"` and consistent active state.

**Language buttons**: Same compact button group pattern.

### What stays the same
- TwoFactorSettings component logic — untouched
- Theme store / auth hooks — unchanged
- i18n pattern — `isBn` ternary throughout
- `mounted` guard for theme rendering

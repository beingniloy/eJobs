## Plan: Employer Profile Fix + Shared Company Components + Cover Image

### Phase 1: Fix Employer Profile Page (`/employer/profile`)

**Issues found:**
1. **`city` field never saved** — district dropdown maps to `address_district` but `city` column stays empty. `buildFormData()` doesn't append `city`.
2. **`highlights` field not sent** — backend accepts it, model has it, but no frontend input sends it.
3. **HR team save errors silently swallowed** — `catch {}` means user sees "saved" even when HR team fails.
4. **Stale previews after save** — `logoPreview`/`coverPreview` read from stale `hookCompany`.

**Fix:** Modify `src/app/(employer)/employer/profile/page.tsx`:
- Add `fd.append("city", district)` in `buildFormData()`
- Add `highlights` state + UI input in overview step
- Fix HR team save to show error toast
- Update previews from save response instead of stale hook data

---

### Phase 2: Shared Company Header (Facebook-style cover image)

**Problem:** Cover image is `absolute inset-0` filling the entire banner — text sits ON the cover, no clear separation.

**Target layout (Facebook-style):**
```
┌──────────────────────────────────────┐
│         COVER IMAGE (h-48/64)        │  ← top section, full width
│    ┌──────┐                          │
│    │ LOGO │  Company Name    [Follow]│  ← info overlaps cover bottom
│    └──────┘  Description     [Jobs]  │
│              Location · Industry     │
└──────────────────────────────────────┘
```

**New file: `src/components/company/CompanyProfileHeader.tsx`**
- Cover image at top with fixed height (h-48 md:h-64)
- Logo positioned to overlap cover bottom (-mt-12)
- Profile info below with z-index
- Props: `mode: "owner" | "public"` controls which action buttons show
- Owner mode: Edit Profile, Share, View Public Profile
- Public mode: Follow, Message, Website, View Jobs, Share

---

### Phase 3: Refactor Both Pages to Use Shared Components

**New file: `src/components/company/CompanyProfileSidebar.tsx`**
- Extract shared sidebar content (snapshot, why join, brochure, skills) from `CompanySidebar.tsx`

**Modify: `src/app/(employer)/employer/company-overview/CompanyOverviewClient.tsx`**
- Remove ~80 lines of inline banner code
- Use `<CompanyProfileHeader mode="owner" />` + `<CompanyProfileSidebar />`

**Modify: `src/app/companies/[slug]/CompanyDetailClient.tsx`**
- Replace `CompanyHeader` import with shared `<CompanyProfileHeader mode="public" />`
- Replace `CompanySidebar` with shared `<CompanyProfileSidebar />`

**Delete/simplify: `src/app/companies/[slug]/CompanyHeader.tsx`** (replaced by shared component)

---

### Phase 4: Backend — No Changes Needed

`CompanyController::update()` already accepts `city` and `highlights` in its `$request->only()`. All issues are frontend.

---

### Execution Order
1. Fix employer profile page (Phase 1)
2. Create shared `CompanyProfileHeader` + `CompanyProfileSidebar` (Phase 2)
3. Refactor employer overview (Phase 3)
4. Refactor public profile (Phase 3)
5. TypeScript build check
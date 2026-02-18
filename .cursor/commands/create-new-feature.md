# Create new feature [FEATURE_NAME]

Step-by-step workflow for a full feature: page (or shared component), API, hooks, types, route. Follow `src/pages/`, `src/api/`, `src/hooks/` patterns and `.cursor/rules/`. **For each step reply:** "Step N️⃣: … started" then "Step N️⃣ finished".

**Inputs:** Feature name, requirements (data/API; new page vs shared component).

---

**Step 1 — Analyze.** Feature name and scope; new page vs `src/components/features/`; required data (Supabase, API); shared vs page-local types.

**Step 2 — Directory.** New page: `src/pages/[FeatureName]Page/` with `PageName.tsx`, `.models.ts`, `.constants.ts`, `.helpers.ts`, `index.ts`. Shared feature: `src/components/features/[name]/`. Plan `src/api/` and `src/hooks/` if needed.

**Step 3 — Types.** Page-only → `PageName.models.ts`. Shared/DB → `src/types/` or `database.ts`. No `any`; mirror existing page models.

**Step 4 — API (if needed).** Add/extend `src/api/`; use `@/lib/supabase`, `@/types/database`; match error/offline handling of existing API. Else skip.

**Step 5 — Hooks (if needed).** Add `src/hooks/` for data/state; TanStack Query where appropriate. Else skip.

**Step 6 — UI.** Page: main UI in `PageName.tsx`, logic in `.helpers.ts`, types in `.models.ts`, constants in `.constants.ts`; use shared components. Shared feature: implement in `src/components/features/[name]/` with clear props.

**Step 7 — Route (if new page).** Add route in `src/App.tsx` and nav entry in `src/components/layout/Navbar.tsx`.

User can pass name and requirements after the command, e.g. `/create-new-feature Progress: due today, streak`.

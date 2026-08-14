# Staging Type Quality Repair Design

## Context

The current `staging` branch is synchronized with `origin/staging`, but its
quality baseline is red:

- `npm run lint` reports 76 errors, primarily in `packages/api`.
- `npm run typecheck` reports three errors in the user knowledge UI.
- The repository `test` script is a placeholder and does not run a test suite.

These failures predate this repair. The goal is to restore a green baseline
without changing API requests, response handling, or visible workflows beyond
safe fallbacks for unsupported response values.

## Scope

The repair covers only the files currently reported by lint or typecheck:

- `packages/api/src/admin/grc.ts`
- `packages/api/src/admin/service-catalog.ts`
- `packages/api/src/ai/knowledge.ts`
- `packages/api/src/rbac.ts`
- `packages/api/src/tenant/exam.ts`
- `apps/user-web/src/pages/knowledge/components/DatasetFormDrawer.tsx`
- `apps/user-web/src/pages/knowledge/components/OverviewPanel.tsx`

No dependency versions, lint rules, generated files, routes, styling, or API
endpoints will be changed.

## Type Strategy

### Arbitrary JSON

Replace explicit `any` usage with `unknown`-based object types. Values that are
not interpreted by the frontend remain opaque; consumers must narrow them
before use. Query parameter maps use their actual scalar value types instead
of `any`.

### Open Response Values

Some API response fields currently combine documented string literals with
`string`, which collapses the union and triggers lint errors. Response fields
that intentionally allow future backend values remain open strings. Request
payloads and form values retain the strict documented unions.

The knowledge dataset form narrows response values against the supported
permission and chunk-method sets. Unsupported or absent values fall back to
`me` and `naive`, matching the current defaults.

### Mechanical Type Cleanup

Empty interfaces become type aliases, and unnecessary assertions are removed.
These changes affect TypeScript declarations only and do not alter emitted
JavaScript.

## UI Fallback

Knowledge overview metrics can be absent in an API response. Missing numeric
values render as `0`, preventing a call to `toLocaleString` on `undefined` and
preserving a stable numeric presentation.

## Verification

Use the existing failing checks as the regression gate:

1. Run focused lint for `@ff-ai-frontend/api`.
2. Run focused typecheck for `@ff-ai-frontend/api` and
   `@ff-ai-frontend/user-web`.
3. Run full `npm run lint`.
4. Run full `npm run typecheck`.
5. Run full `npm run build` because the repository has no real test script.
6. Confirm `git diff --check` and review the final diff against
   `EXP-VERIFY-001` and `EXP-VERIFY-002`.

## Non-Goals

- Redesigning API domain models.
- Tightening backend contracts that are currently open-ended.
- Disabling or weakening lint rules.
- Resolving pnpm trust-policy findings or changing the lockfile.
- Refactoring unrelated application code.

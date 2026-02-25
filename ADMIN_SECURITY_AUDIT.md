# Admin Security Consistency Audit (Next.js App Router + Firebase)

## Scope
- Admin UI routing and gating
- Middleware behavior for `/admin`
- Admin-related API routes under `/app/api/admin/*`
- Non-admin API routes under `/app/api/*` that perform admin-only actions
- Admin auth helpers and authorization logic

## Key Findings
1. **Admin authorization logic is inconsistent across the codebase**:
   - Client/admin layout uses a hardcoded email allowlist.
   - Several API routes also use hardcoded email allowlist checks.
   - Some admin APIs use Firebase custom claim (`decodedToken.admin === true`).
   - One admin API uses a separate static bearer token (`ADMIN_EXPORT_TOKEN`) instead of Firebase ID token verification.
   - Claim assignment endpoint uses `SUPER_ADMIN_EMAIL`.

2. **`/admin` route protection is client-side only**:
   - `middleware.ts` does locale redirection and excludes `/api`, but does not enforce admin checks.
   - Admin layout performs redirect checks in a client effect based on `useAdmin()` email allowlist.

3. **Admin API verification coverage is partial**:
   - `api/admin/orders-sync`: verifies Firebase ID token + checks custom admin claim.
   - `api/admin/claim`: verifies Firebase ID token + checks `SUPER_ADMIN_EMAIL`.
   - `api/admin/orders-export`: does **not** verify Firebase ID token; uses static bearer token.

4. **Admin-like actions outside `/api/admin/*` are mixed**:
   - `api/orders` and `api/orders/[orderId]` verify Firebase ID token, but admin authorization uses hardcoded email allowlist.
   - `api/categories` and `api/categories/[id]` perform write/delete actions without explicit API-layer auth; they rely on underlying Firestore permissions/Admin SDK behavior.

## Minimal-Change Fix Strategy
1. Introduce one server helper in `src/lib/firebaseAdmin.ts` for admin authorization policy:
   - `isAdminAuthorized(decodedToken)` that returns true if either:
     - `decodedToken.admin === true` (custom claim), **or**
     - email is in allowlist (temporary backward compatibility).

2. Replace endpoint-local admin checks with that helper:
   - `src/app/api/orders/route.ts`
   - `src/app/api/orders/[orderId]/route.ts`
   - `src/app/api/admin/orders-sync/route.ts` (already close; swap to unified helper)

3. Upgrade `src/app/api/admin/orders-export/route.ts` to Firebase ID token verification:
   - Keep `ADMIN_EXPORT_TOKEN` as optional second-factor gate for minimal rollout risk.
   - Require both valid Firebase ID token and admin authorization helper.

4. Add lightweight auth guard to category mutation APIs:
   - `src/app/api/categories/route.ts` POST/DELETE
   - `src/app/api/categories/[id]/route.ts` DELETE
   - Verify ID token from `Authorization` header and apply unified admin authorization helper.

5. Keep `/admin` client gating for UX, but reduce drift:
   - Update `src/lib/admin.ts` to prefer custom claim from `getIdTokenResult()` when available, with allowlist fallback.
   - Optional future hardening: server-side gate using cookie/session in middleware or server layouts.

## Risk Prioritization
- High:
  - `api/admin/orders-export` static token auth only.
  - Category mutation APIs lack explicit API-layer auth checks.
- Medium:
  - `/admin` UI is client-gated only.
  - Mixed admin policy (allowlist vs claim vs SUPER_ADMIN_EMAIL) increases operational error risk.
- Low:
  - Existing Firebase-token-verified routes that still use allowlist checks (functionally restrictive but drift-prone).

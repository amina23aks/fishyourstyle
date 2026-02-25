# Firebase Credential Environment Variable Security Summary

## Variables scanned
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_ADMIN_CLIENT_EMAIL`

## 1) Where each variable is used

### `FIREBASE_PRIVATE_KEY`
- `src/lib/firebaseAdmin.ts`
  - Used as fallback for Admin SDK private key when `FIREBASE_ADMIN_PRIVATE_KEY` is absent.
- Server scripts using Admin SDK credentials:
  - `scripts/seed-categories.ts`
  - `scripts/seed-products.ts`
  - `scripts/cleanup-firestore.ts`
  - `scripts/seed-design-themes.ts`
- Referenced in docs/error messaging:
  - `src/lib/categories.ts` (error text only)
  - `README.md`

### `FIREBASE_ADMIN_PRIVATE_KEY`
- `src/lib/firebaseAdmin.ts`
  - Primary private key source for Admin SDK initialization.

### `FIREBASE_CLIENT_EMAIL`
- `src/lib/firebaseAdmin.ts`
  - Fallback for `FIREBASE_ADMIN_CLIENT_EMAIL`.
- Server scripts using Admin SDK credentials:
  - `scripts/seed-categories.ts`
  - `scripts/seed-products.ts`
  - `scripts/cleanup-firestore.ts`
  - `scripts/seed-design-themes.ts`
- Referenced in docs/error messaging:
  - `src/lib/categories.ts` (error text only)
  - `README.md`

### `FIREBASE_ADMIN_CLIENT_EMAIL`
- `src/lib/firebaseAdmin.ts`
  - Primary client email source for Admin SDK initialization.

## 2) Is `FIREBASE_PRIVATE_KEY` used by client code?
- **No direct usage found in client components or client-only libraries.**
- All functional reads of `FIREBASE_PRIVATE_KEY` are in:
  - `src/lib/firebaseAdmin.ts` (`server-only` module), and
  - Node scripts under `/scripts`.
- Therefore, there is **no current evidence** that `FIREBASE_PRIVATE_KEY` is shipped to client bundles.

## 3) Does Admin SDK initialize only in server files?
- **Yes.**
- Admin SDK initialization is centralized in `src/lib/firebaseAdmin.ts` and the file starts with `import "server-only";`.
- Admin SDK is also initialized in standalone Node scripts under `/scripts`.
- Imports of `@/lib/firebaseAdmin` are only in API routes, server utilities, and server components (no `"use client"` consumers found).

## 4) Any private key exposure to client bundles?
- **No explicit exposure found** for private key variables.
- No `NEXT_PUBLIC_*` variable references include private key/client email credentials.
- Current client-exposed env usage is limited to public keys/IDs (e.g., Firebase public config, Cloudinary upload preset, analytics IDs).

## Security verdict
- **Current state:** No critical private key leakage identified.
- **Residual risk to monitor:** `src/lib/firebaseConfig.ts` (used by client paths) falls back to non-`NEXT_PUBLIC` env names for public Firebase config values. This does not currently expose private keys, but keeping client config strictly `NEXT_PUBLIC_*` would reduce ambiguity.

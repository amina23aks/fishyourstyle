This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Updating your local copy

If `git pull` asks you to resolve changes before pulling:

1. Check `git status` and commit or stash any local edits.
2. Pull again once the working tree is clean.
3. If conflicts remain, open the flagged files in VS Code, pick the correct versions, then commit the resolution.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Environment variables

Required for local development and production:

- `NEXT_PUBLIC_FIREBASE_API_KEY` (or server-side fallback `FIREBASE_API_KEY`)
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (or `FIREBASE_AUTH_DOMAIN`)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (or `FIREBASE_PROJECT_ID`)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (or `FIREBASE_STORAGE_BUCKET`)
- `NEXT_PUBLIC_FIREBASE_APP_ID` (or `FIREBASE_APP_ID`)
- `FIREBASE_PROJECT_ID` (or `FIREBASE_ADMIN_PROJECT_ID`)
- `FIREBASE_CLIENT_EMAIL` (or `FIREBASE_ADMIN_CLIENT_EMAIL`)
- `FIREBASE_PRIVATE_KEY` (or `FIREBASE_ADMIN_PRIVATE_KEY`, with `\n` preserved)

Required only for specific operational tooling:

- `SUPER_ADMIN_EMAIL` — required for the protected `POST /api/admin/claim` tool.
- `ADMIN_EXPORT_TOKEN` — required in Google Apps Script properties for `Code.gs` order export sync.
- `CONFIRM_CLEANUP=true` — required only when intentionally running `npm run cleanup:firestore`.

Optional integrations:

- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (or `FIREBASE_MEASUREMENT_ID`) — Firebase analytics measurement ID.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics page view tracking.
- `NEXT_PUBLIC_META_PIXEL_ID` — Meta Pixel browser tracking.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — admin product image uploads and Cloudinary delivery URLs.
- `TELEGRAM_NOTIFICATIONS_ENABLED`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` — order/contact notification delivery.
- `NEXT_PUBLIC_VERCEL_ENV` — Vercel environment label used to suppress Meta Pixel outside production.

## Firestore product seeding

Products are stored in Firestore and the storefront reads directly from that collection (the JSON file is only for initial data).

- Required env vars for the Admin SDK: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (use `\\n` for newlines).
- Seed or reseed locally with: `npm run seed:products`
  - This runs `scripts/seed-products.ts`, reading `src/data/products.json` and writing to the `products` collection using the slug as the doc ID. Existing docs are updated instead of duplicated.
- To clear and reseed: delete the `products` collection in the Firebase console (or `firebase firestore:delete --project $FIREBASE_PROJECT_ID --recursive --collection products` if you have the CLI), then rerun the seed command above.
- If the JSON changes aren’t appearing in Firestore, verify those three env vars are present in your shell session and that `FIREBASE_PRIVATE_KEY` preserves newlines (escaped as `\n` or pasted as actual newlines). The seed script will throw if any credential is missing.
- Managing categories/designs via the dashboard uses the same Admin credentials; if they’re absent and your Firestore rules only allow `products`/`orders`, you’ll see a permission error when adding or deleting. Either loosen the rules for the `categories` collection or set the Admin env vars above so server-side calls can bypass client rules.

## Local runbook (Firestore data)

1. *(Optional)* Reset Firestore locally with `CONFIRM_CLEANUP=true npm run cleanup:firestore` to clear `products` and `categories` (design themes live in `categories`).
2. Seed everything in order: `npm run seed:all` (categories → design themes → products).
3. Verify Firestore now has 5 collection docs (`hoodies`, `pants`, `ensembles`, `tshirts`, `sweatshirts`) and 1 design doc (`simple`) under `categories`.
4. Open `/shop` and `/admin` locally to confirm filters reflect Firestore data and that categories/designs cannot be deleted while products reference them.

## Cloudflare Pages deployment tips

This project is configured for Cloudflare Pages (`wrangler.toml` sets `pages_build_output_dir`). Use `npm run build:pages` (which explicitly disables proxy settings) as the build command in Pages so the `.vercel/output/static` bundle is generated for both Preview and Production environments without npm registry connectivity issues. The `build` script now runs a plain `next build` to avoid recursive invocation when `@cloudflare/next-on-pages` triggers `vercel build` internally. A repo-level `.npmrc` pins the public npm registry and clears proxy settings so the Vercel CLI invoked by `@cloudflare/next-on-pages` does not try to install through a blocked proxy.

See `DEPLOYMENT_HISTORY.md` for a summary of the most recent production deployment, including the command used and the routes that were prerendered.

If a preview URL works but the main `*.pages.dev` domain is blank or times out, make sure a production build exists.

1. Push to the production branch (usually `main`) so Cloudflare Pages triggers a **Production** deployment instead of a Preview build.
2. In the Cloudflare Pages dashboard, open the project and confirm the latest Production deployment succeeded.
3. Verify that the production domain (e.g., `fishyourstyle.pages.dev` or any custom domain) is attached and active in the **Domains** tab.
4. If the domain still fails to load, rerun the Production deployment from the dashboard to regenerate the site output.

## Firebase Admin access and rules

- Server-side Firebase Admin uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (with `\n` preserved) for initialization, plus `SUPER_ADMIN_EMAIL` for protected admin-claim tooling.
- Admin-only endpoints/pages expect a Firebase Auth ID token with the `admin` custom claim in the `Authorization: Bearer <idToken>` header.
- `POST /api/admin/claim` remains a protected backend admin-claim tool restricted to the configured `SUPER_ADMIN_EMAIL`; there is no temporary bootstrap UI.
- Firestore security rules live in `firestore.rules`; deploy them to the project to enforce public reads for catalog data, admin-only writes and order access, locked-down contact messages, and owner-only wishlists.

## Google Sheets order sync

Google Apps Script cannot mint a Firebase Auth ID token for the dashboard admin flow. The Sheets sync is a machine-to-machine export integration and should call the dedicated export endpoint with the shared export token instead:

- Endpoint: `GET https://fishyourstyle.vercel.app/api/admin/orders-export?max=200`
- Required Vercel env var: `ADMIN_EXPORT_TOKEN`
- Required Apps Script property: `ADMIN_EXPORT_TOKEN` with the same value as Vercel
- Required request header: `Authorization: Bearer <ADMIN_EXPORT_TOKEN>`

The export token is accepted only by the order export/sync endpoints. Normal admin APIs still require a Firebase Auth ID token whose user has the `admin` custom claim. Missing, wrong, or malformed export tokens must return `401`.

Apps Script `Code.gs` should send the token exactly like this:

```js
const token = PropertiesService.getScriptProperties().getProperty("ADMIN_EXPORT_TOKEN");
const response = UrlFetchApp.fetch("https://fishyourstyle.vercel.app/api/admin/orders-export?max=200", {
  method: "get",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  muteHttpExceptions: false,
});
```

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

## Firestore product seeding

Products are stored in Firestore and the storefront reads directly from that collection (the JSON file is only for initial data).

- Required env vars for the Admin SDK: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (use `\\n` for newlines).
- Seed or reseed locally with: `npm run seed:products`
  - This runs `scripts/seed-products.ts`, reading `src/data/products.json` and writing to the `products` collection using the slug as the doc ID. Existing docs are updated instead of duplicated.
- To clear and reseed: delete the `products` collection in the Firebase console (or `firebase firestore:delete --project $FIREBASE_PROJECT_ID --recursive --collection products` if you have the CLI), then rerun the seed command above.
- If the JSON changes aren’t appearing in Firestore, verify those three env vars are present in your shell session and that `FIREBASE_PRIVATE_KEY` preserves newlines (escaped as `\n` or pasted as actual newlines). The seed script will throw if any credential is missing.
- Managing categories/designs via the dashboard uses the same Admin credentials; if they’re absent and your Firestore rules only allow `products`/`orders`, you’ll see a permission error when adding or deleting. Either loosen the rules for the `categories` collection or set the Admin env vars above so server-side calls can bypass client rules.

## Cloudflare Pages deployment tips

This project is configured for Cloudflare Pages (`wrangler.toml` sets `pages_build_output_dir`). Use `npm run build:pages` (which explicitly disables proxy settings) as the build command in Pages so the `.vercel/output/static` bundle is generated for both Preview and Production environments without npm registry connectivity issues. The `build` script now runs a plain `next build` to avoid recursive invocation when `@cloudflare/next-on-pages` triggers `vercel build` internally. A repo-level `.npmrc` pins the public npm registry and clears proxy settings so the Vercel CLI invoked by `@cloudflare/next-on-pages` does not try to install through a blocked proxy.

See `DEPLOYMENT_HISTORY.md` for a summary of the most recent production deployment, including the command used and the routes that were prerendered.

If a preview URL works but the main `*.pages.dev` domain is blank or times out, make sure a production build exists.

1. Push to the production branch (usually `main`) so Cloudflare Pages triggers a **Production** deployment instead of a Preview build.
2. In the Cloudflare Pages dashboard, open the project and confirm the latest Production deployment succeeded.
3. Verify that the production domain (e.g., `fishyourstyle.pages.dev` or any custom domain) is attached and active in the **Domains** tab.
4. If the domain still fails to load, rerun the Production deployment from the dashboard to regenerate the site output.

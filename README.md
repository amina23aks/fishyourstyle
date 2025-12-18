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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cloudflare Pages deployment tips

This project is configured for Cloudflare Pages (`wrangler.toml` sets `pages_build_output_dir`). Use `npm run build:pages` (which explicitly disables proxy settings) as the build command in Pages so the `.vercel/output/static` bundle is generated for both Preview and Production environments without npm registry connectivity issues. The `build` script now runs a plain `next build` to avoid recursive invocation when `@cloudflare/next-on-pages` triggers `vercel build` internally. A repo-level `.npmrc` pins the public npm registry and clears proxy settings so the Vercel CLI invoked by `@cloudflare/next-on-pages` does not try to install through a blocked proxy.

See `DEPLOYMENT_HISTORY.md` for a summary of the most recent production deployment, including the command used and the routes that were prerendered.

If a preview URL works but the main `*.pages.dev` domain is blank or times out, make sure a production build exists.

1. Push to the production branch (usually `main`) so Cloudflare Pages triggers a **Production** deployment instead of a Preview build.
2. In the Cloudflare Pages dashboard, open the project and confirm the latest Production deployment succeeded.
3. Verify that the production domain (e.g., `fishyourstyle.pages.dev` or any custom domain) is attached and active in the **Domains** tab.
4. If the domain still fails to load, rerun the Production deployment from the dashboard to regenerate the site output.

## Firebase Admin access and rules

- Server-side Firebase Admin uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (with `\n` preserved) for initialization, plus `SUPER_ADMIN_EMAIL` for bootstrap.
- Admin-only endpoints/pages expect an ID token in the `Authorization: Bearer <idToken>` header or in one of the cookies `__session`, `session`, or `idToken`.
- Bootstrap admin claim: set `SUPER_ADMIN_EMAIL` in the environment, sign in that user in the browser, grab their ID token via the Firebase Auth client (`getAuth().currentUser?.getIdToken()`), then call `POST /api/admin/claim` with JSON `{ "uid": "<targetUid>" }` and `Authorization: Bearer <idToken>`. Only the email matching `SUPER_ADMIN_EMAIL` can perform this once to seed admins.
- Firestore security rules live in `firestore.rules`; deploy them to the project to enforce public reads for catalog data, admin-only writes and order access, locked-down contact messages, and owner-only wishlists.

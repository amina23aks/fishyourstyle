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

## Firebase admin setup & custom claims

Provide Firebase Admin SDK credentials as environment variables (double-escape newlines in the private key):

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nabc123...\\n-----END PRIVATE KEY-----\\n"
SUPER_ADMIN_EMAIL=founder@yourdomain.com
```

- The `SUPER_ADMIN_EMAIL` account can bootstrap the first admin; afterwards only users with `admin: true` custom claims may grant admin rights.
- Deploy the Firestore rules in `firestore.rules` to enforce admin-only writes and the read protections described in the file.

### Seeding an admin user from the browser

1. Sign in as the `SUPER_ADMIN_EMAIL` user (or any existing admin) in the browser.
2. In DevTools, fetch a fresh ID token and call the claim endpoint:

```js
import { getAuth } from "firebase/auth";

const auth = getAuth();
const token = await auth.currentUser?.getIdToken(/* forceRefresh */ true);
await fetch("/api/admin/claim", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email: "target-user@domain.com" }),
});
```

3. Have the target user sign out and back in to receive the updated admin claim.

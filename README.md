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

- Server-side Firebase Admin uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (with `\n` preserved) for initialization, plus `SUPER_ADMIN_EMAIL` for bootstrap.
- Admin-only endpoints/pages expect an ID token in the `Authorization: Bearer <idToken>` header or in one of the cookies `__session`, `session`, or `idToken`.
- Bootstrap admin claim: set `SUPER_ADMIN_EMAIL` in the environment, sign in that user in the browser, use the temporary developer-only console snippet below to get a fresh ID token, then call `POST /api/admin/claim` with JSON `{ "uid": "<targetUid>" }` and `Authorization: Bearer <idToken>`. Only the email matching `SUPER_ADMIN_EMAIL` can perform this once to seed admins.
- Firestore security rules live in `firestore.rules`; deploy them to the project to enforce public reads for catalog data, admin-only writes and order access, locked-down contact messages, and owner-only wishlists.

### Temporary developer-only ID token snippet

Use this only from your own signed-in browser session when bootstrapping admin claims. It does not add a debug page and does not expose tokens in the UI; the token is returned only in your browser console. Do not paste the token into screenshots, chat, logs, or committed files, and close the console tab when finished.

This project initializes Firebase Auth through the modular client helper in `src/lib/firebaseClient.ts` (`initializeApp` + `getAuth`). Because the bundled app does not expose Firebase globals, the console snippet below loads the same Firebase modular SDK version from Google, initializes the default app with the same public web config, waits for the persisted signed-in user, and then calls `currentUser.getIdToken(true)` for a fresh token. Replace the config values with this app's Firebase web config values from your deployed `NEXT_PUBLIC_FIREBASE_*` environment variables or Firebase console.

```js
const firebaseConfig = {
  apiKey: "<NEXT_PUBLIC_FIREBASE_API_KEY>",
  authDomain: "<NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN>",
  projectId: "<NEXT_PUBLIC_FIREBASE_PROJECT_ID>",
  storageBucket: "<NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET>",
  appId: "<NEXT_PUBLIC_FIREBASE_APP_ID>",
  measurementId: "<NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID>", // optional; remove if unused
};

await (async () => {
  const [{ initializeApp, getApp, getApps }, { getAuth, onAuthStateChanged }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
  ]);

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const user = auth.currentUser ?? await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("No signed-in Firebase user found. Sign in, then run this snippet again."));
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(firebaseUser);
    }, reject);
  });

  if (!user) {
    throw new Error("No signed-in Firebase user found. Sign in, then run this snippet again.");
  }

  return {
    uid: user.uid,
    email: user.email,
    idToken: await user.getIdToken(true),
  };
})();
```

Windows PowerShell example for calling the bootstrap route after copying the returned `idToken` and choosing the target user UID:

```powershell
$baseUrl = "https://<your-vercel-domain>" # or "http://localhost:3000" for local testing
$idToken = "<fresh ID token returned by the browser snippet>"
$targetUid = "<uid to grant admin access>"
$body = @{ uid = $targetUid } | ConvertTo-Json -Compress

curl.exe -X POST "$baseUrl/api/admin/claim" `
  -H "Authorization: Bearer $idToken" `
  -H "Content-Type: application/json" `
  --data $body
```

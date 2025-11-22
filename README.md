This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started (local dev)

1. Install dependencies once with `npm install`.
2. Start the local dev server with `npm run dev` (or `yarn dev`/`pnpm dev`/`bun dev`).
3. Open [http://localhost:3000](http://localhost:3000) to view the app. Save changes to `app/page.tsx` to auto-refresh the page.

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

This project is configured for Cloudflare Pages (`wrangler.toml` sets `pages_build_output_dir`). In Cloudflare Pages, set the build command to `npm run build:pages` so the `.vercel/output/static` bundle is generated for both Preview and Production environments.

For local development, continue using `npm run dev`. The `build:pages` command is only needed when Pages runs your build step in Preview or Production.

If a preview URL works but the main `*.pages.dev` domain is blank or times out, make sure a production build exists using the same `npm run build:pages` command.

1. Push to the production branch (usually `main`) so Cloudflare Pages triggers a **Production** deployment instead of a Preview build.
2. In the Cloudflare Pages dashboard, open the project and confirm the latest Production deployment succeeded.
3. Verify that the production domain (e.g., `fishyourstyle.pages.dev` or any custom domain) is attached and active in the **Domains** tab.
4. If the domain still fails to load, rerun the Production deployment from the dashboard to regenerate the site output.

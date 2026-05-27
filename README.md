This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Access model and environment variables

The kiosk public routes are:

- `/`
- `/visitor`
- `/employee`
- `/pin`

The protected route is `/admin`.

Visitors do not log in. They use `/visitor` to select and mock-call an
employee. Employees do not log in. They use `/employee` and `/pin` to enter an
employee PIN. The PIN validation stays server-side and PIN hashes must never be
sent to the browser.

The admin portal uses Supabase Auth email/password login plus one server-only
allowlist value: `ADMIN_EMAIL`. There should be exactly one admin user.

Required Supabase client variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported for compatibility if the
publishable key is not set.

Required server-only admin variable:

```bash
ADMIN_EMAIL=admin@example.com
```

Do not prefix `ADMIN_EMAIL` with `NEXT_PUBLIC`. Do not expose service role keys
to the browser.

## Supabase admin user setup

Create exactly one admin user manually in Supabase:

1. Open the Supabase Dashboard.
2. Go to Authentication > Users.
3. Click Add user.
4. Enter the admin email and password.
5. Set `ADMIN_EMAIL` in `.env.local` to that exact email address.
6. Later, set the same `ADMIN_EMAIL` value in Vercel environment variables.
7. Use that email and password at `/admin/login`.

Do not add admin passwords to this repository or to public environment
variables. The app only needs `NEXT_PUBLIC_SUPABASE_URL` and either
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
the browser. `ADMIN_EMAIL` is read only on the server.

The development RLS policies in `supabase/schema.sql` are intentionally broad
so the current kiosk/admin workflow remains easy to test. Review and tighten
them before production:

- public users should read only active employees
- public/kiosk flows may insert event logs but must not read all logs
- only the configured admin should manage employees and photos
- only the configured admin or server-side PIN validation should access
  `employee_access_codes`
- only the configured admin should read event logs

## Employee photo storage setup

Employee photos are uploaded to Supabase Storage, not to the Next.js `public`
folder. Create the bucket in Supabase before uploading photos:

1. Open the Supabase Dashboard.
2. Go to Storage.
3. Click New bucket.
4. Name it `employee-photos`.
5. Set it to public so visitor cards can render the stored public URLs.
6. Set a 2 MB file size limit and allow `image/jpeg`, `image/png`, and
   `image/webp`.

For development, the schema includes Storage policies that allow public reads
from `employee-photos` and authenticated uploads to that bucket. Production
upload access must be restricted to authenticated admin users only.

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

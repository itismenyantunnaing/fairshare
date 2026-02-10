# Implementation Summary — Donation App

This summary documents recent changes to the donation frontend and backend API integration.

## Key Changes

- Donate page (`app/donate/page.tsx`)
  - Locked to Myanmar region (`mm`) with presets: 5000, 10000, 20000, 50000 (Ks).
  - Removed QR Pay upload option; now KPay/Wave handled in checkout via provider QR images.
  - Donation data is POSTed to `/api/pending_donation` before saving to `sessionStorage` and redirecting to checkout.

- Checkout (`app/donate/checkout/page.tsx`)
  - Shows provider QR (`/public/kpay-qr.svg` and `/public/wave-qr.svg`) for `kpay` and `wave` methods.
  - `Done` button acknowledges client-side and routes to `/donate/thanks`.
  - Card form kept for other providers (Stripe/PayPal/Razorpay) using the existing simulated processor.
  - Order summary layout adjusted for increased width.

- Thank you page (`app/donate/thanks/page.tsx`)
  - Simple acknowledgment page that clears pending donation data from `sessionStorage`.

- MongoDB integration
  - `lib/mongodb.ts` — MongoDB connection helper (singleton client) using `MONGODB_URI` env var.
  - `app/api/pending_donation/route.ts` — API route to persist donations into MongoDB (`pending_donations` collection) and to list recent donations.
  - `package.json` updated to include the `mongodb` driver dependency.
  - `.env.local.example` provided with sample `MONGODB_URI` values.

## Notes & Next Steps

- You must add your real connection string to `.env.local` as `MONGODB_URI` and run `npm install` to install the `mongodb` driver.

Commands to run locally:

```bash
npm install
cp .env.local.example .env.local
# edit .env.local to set MONGODB_URI
npm run dev
```

- The API route is server-only; client code posts donation data to `/api/pending_donation`.
- For production, secure your connection string and consider adding authentication to the API.


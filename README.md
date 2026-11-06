# Ledger Wallet

Personal finance tracker built with React, TypeScript, Vite, and Firebase. Track accounts, transactions, budgets, recurring payments, financial goals, and debts in one dashboard.

## Features

- Google sign-in with Firestore security rules scoped per user
- Dashboard with balance summary, cash-flow chart, expense breakdown, and financial health score
- Transactions with search, type/date filters, pagination, edit, and delete
- Multiple accounts with transfers between accounts
- Monthly budgets per category with over-budget indicators
- Recurring transactions with automatic posting when the app opens
- Financial goals with contributions and progress tracking
- Debts and receivables with payment recording and overdue indicators
- Custom categories, CSV/PDF export, and JSON backup/restore
- Dark mode, responsive layout, and PWA support with Firestore offline persistence

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui-style components
- Zustand for state
- Firebase Auth + Firestore
- Recharts, react-hook-form, Zod, date-fns
- Vitest for unit tests

## Getting started

Requirements: Node.js 20+ and a Firebase project.

```bash
npm install
cp .env.example .env
```

Fill `.env` with your Firebase web app configuration:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Then run the app:

```bash
npm run dev
```

## Firebase setup

1. Enable **Google** as a sign-in provider in Firebase Authentication.
2. Create a Firestore database.
3. Deploy rules and indexes:

```bash
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

4. Optional: deploy hosting with `npm run build && firebase deploy --only hosting`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest |
| `npm run preview` | Preview the production build |

## Project structure

```text
src/
  components/   UI, layout, dialogs, and feature components
  hooks/        Shared hooks
  lib/          Firebase, Zustand stores, helpers, financial health
  pages/        Route-level pages
```

## Data notes

- Currency is locked once financial data exists. Changing the currency setting only changes formatting, so it is disabled to prevent existing amounts from being relabeled.
- Deleting an account unlinks its transactions (including transfers) and pauses recurring rules that used it.
- Goal contributions and debt payments are linked to their source record; deleting those transactions rolls back the linked goal/debt. Older transactions created before link fields existed cannot be rolled back automatically.
- Recurring transactions are processed client-side when the app loads. Multiple tabs are protected by Firestore transactions.
- Backup restore is only allowed when the current account has no financial data.

## CI

`.github/workflows/ci.yml` runs install, lint, tests, and production build on pushes and pull requests.

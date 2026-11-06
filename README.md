# Ledger Wallet

Personal finance tracker built with React, TypeScript, Vite, and Firebase. Track accounts, transactions, budgets, recurring payments, financial goals, and debts in one dashboard.

## Features

- Google, email/password, and password-reset authentication with Firestore security rules scoped per user
- Account deletion with reauthentication and full data cleanup
- Dashboard with balance summary, cash-flow chart, expense breakdown, and financial health score
- Financial health metrics with a 3-month window, liquid/emergency-fund balances, minimum debt payments, and expense/fun ratios
- Net Worth page with asset composition, liabilities, receivables, and excluded assets
- 50/30/20 needs/wants/savings dashboard widget
- Monthly financial health score history
- Debt payoff projection based on minimum payments and interest rates
- Transactions with search, type/date filters, pagination, edit, and delete
- Multiple accounts with transfers between accounts
- Monthly budgets per category with over-budget indicators
- Recurring transactions with automatic posting when the app opens
- Financial goals with contributions and progress tracking
- Debts and receivables with payment recording and overdue indicators
- Custom categories with configurable groups (essential, discretionary, debt, other)
- Assets and accounts with liquidity, net-worth inclusion, and emergency-fund flags
- Debts with minimum payments, interest rates, and principal/interest payment splits
- Configurable financial targets for savings rate, DTI, and emergency-fund months
- CSV/PDF export and JSON backup/restore
- Dark mode, responsive layout, manual PWA service worker, and Firestore offline persistence

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui-style components
- Zustand for state
- Firebase Auth + Firestore
- Recharts, react-hook-form, Zod, date-fns
- Vitest for unit tests

## Getting started

Requirements: Node.js 22 LTS and a Firebase project. The repository includes `.nvmrc`; with nvm run `nvm use` before installing. Node 23 is not supported by the current Vite/Vitest toolchain.

```bash
nvm use
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

1. Enable **Google** and **Email/Password** sign-in providers in Firebase Authentication.
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

- Financial health uses a rolling 3-month window for income, expenses, DTI, and emergency-fund coverage. Net worth is a current snapshot.
- Goal contributions are stored as `savings`, not `expenses`, so they do not reduce the savings ratio. Legacy goal contributions are migrated automatically when the transaction listener loads.
- Emergency fund coverage uses accounts marked **Use as emergency fund**. If none are marked, Cash, Bank, and Wallet accounts are used. Investment accounts are excluded by default. The denominator uses essential-category expenses, falling back to total expenses when no essential categories are present.
- DTI uses each debt's **minimum monthly payment** when available; otherwise it falls back to actual debt-tagged payments over the last 3 months.
- Expense Ratio and Fun Ratio use each category's group. Groups can be changed from **Settings → Categories**; default categories start with sensible groups and custom categories can be set to essential, discretionary, debt, or other.
- Accounts can be marked liquid, included in net worth, and/or used as emergency funds. Property and Vehicle account types are available for non-cash assets.
- Debts can include a minimum monthly payment and annual interest rate. For debts with an interest rate, only the estimated interest portion counts as a consumption expense; principal reduces the debt balance. Transaction history still shows the full cash payment.
- Financial targets (emergency-fund months, savings rate, and maximum DTI) can be changed in **Settings → Financial Targets** and are persisted locally.
- The Financial Health widget writes one snapshot per month to the `health_snapshots` collection. History appears in **Reports** after the dashboard has been opened with income and expense data.
- The debt payoff projection assumes minimum payments only; it does not model extra payments or negative amortization.
- Deploy Firestore rules after updating the app so the new `health_snapshots` collection is available:
  ```bash
  firebase deploy --only firestore:rules
  ```
- The dashboard shows **Insufficient Data** instead of a misleading Critical score when there are no income or expense transactions.
- Currency is locked once financial data exists. Changing the currency setting only changes formatting, so it is disabled to prevent existing amounts from being relabeled.
- Deleting an account unlinks its transactions (including transfers) and pauses recurring rules that used it.
- Goal contributions and debt payments are linked to their source record; deleting those transactions rolls back the linked goal/debt. Older transactions created before link fields existed cannot be rolled back automatically.
- Recurring transactions are processed client-side when the app loads. Multiple tabs are protected by Firestore transactions.
- Backup restore is only allowed when the current account has no financial data.

## Dependency overrides

`package.json` pins patched versions of two transitive dependencies:

- `@grpc/grpc-js` for Firebase Firestore (the version pinned by Firebase is affected by known advisories).
- `minimatch` for `@typescript-eslint/typescript-estree`.

`npm audit` reports zero vulnerabilities with these overrides. Run tests, lint, and build after changing them.

## CI

`.github/workflows/ci.yml` runs install, lint, tests, and production build on Node 22 for pushes and pull requests.

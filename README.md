# Banking App – Playwright TypeScript Test Suite

Automated API, UI, and end‑to‑end tests for a sample banking web application using Playwright Test (TypeScript).  
Covers accounts listing, internal transfers between user accounts, negative scenarios, and runs as a cross‑browser CI pipeline on GitHub Actions (Chromium + Firefox).

---

## Tech Stack

- **Language:** TypeScript
- **Test Runner:** Playwright Test
- **Browsers:** Chromium, Firefox (CI), WebKit (local optional)
- **App Under Test:** Sample Banking App (Node/Express + vanilla JS)
- **CI:** GitHub Actions (smoke + regression workflows)
- **Assertions / Patterns:**
  - Page Object style helpers
  - Tag‑based test selection (`@smoke`, `@regression`, `@api`, `@e2e`, `@ui`)
  - Invariant‑based assertions (balance conservation across accounts)

---

## Project Structure

```text
.
├─ playwright.config.ts
├─ package.json
├─ playwright.yml               # GitHub Actions workflow
├─ src/                         # Banking app server & frontend (app under test)
│  ├─ server.ts / server.js
│  └─ public/
│     └─ index.html             # Accounts + Transfer + Transfer History SPA
└─ tests/
   ├─ api/
   │  └─ banking-api.spec.ts    # API regression (login, list accounts, transfer)
   ├─ e2e/
   │  └─ transfer-ui.spec.ts    # UI E2E: positive + negative transfer flows
   ├─ fixtures/
   │  └─ bank.fixtures.ts       # Custom fixtures, helpers, balance utilities
   └─ utils/
      └─ test-data.ts           # Any shared test data (if applicable)


Tests Implemented
API Tests (tests/api/banking-api.spec.ts)
@api @regression API - list accounts after login
Logs in via API, retrieves account list for authenticated user.
Asserts:
200 OK
At least two accounts returned
Shape of account objects (id, type, balance).
@api @regression API - successful transfer between user accounts
Uses authenticated session to:
Get initial balances for two accounts.
Execute a transfer.
Re‑query balances and verify:
Total balance across both accounts is conserved.
One account decreases by transfer amount, the other increases.
UI / E2E Tests (tests/e2e/transfer-ui.spec.ts)
@e2e @regression UI - user can transfer between own accounts and see updated balances and history
Logs in via UI.
Uses label‑based locators (From Account:, To Account:, Amount:).
Performs a valid transfer for a fixed amount.
Asserts:
Accounts table has expected rows.
Total funds across the two accounts are conserved.
One account changes by +amount, the other by −amount (robust to account order).
Transfer history <ul id="transfer-history"> shows a new entry with:
The correct formatted amount (e.g. $10.00).
Both participating account IDs.
@e2e @regression UI - transfer with invalid amount shows error and does not change balances or history
Logs in via UI.
Attempts a transfer with amount = 0.
Asserts:
Error message is visible in #transfer-error.
Success message #transfer-success is empty.
Balances for both involved accounts do not change.
History length does not increase.
Tags and Test Selection
Tests are annotated with tags:

@smoke – very small, fast checks (used by Smoke (chromium) job).
@regression – deeper coverage across API and UI.
@api – API‑only tests.
@e2e – full UI end‑to‑end scenarios.
Examples:

bash
Copy
# All tests
npx playwright test

# Smoke suite only
npx playwright test --grep "@smoke"

# Full regression (API + UI/E2E)
npx playwright test --grep "@regression"

# Only API regression
npx playwright test tests/api --grep "@regression"

# Only E2E UI tests
npx playwright test tests/e2e --grep "@e2e"
Running the Project Locally
1. Install dependencies
bash
Copy
npm install
2. Start the banking app
Run the Node server that hosts the Sample Banking App:

bash
Copy
npm run dev     # or: npm start   (depending on your package.json)
By default the app is served at:

text
Copy
http://localhost:3000
The UI under test is a single‑page app (SPA) that exposes:

Accounts table
Transfer form (From Account / To Account / Amount)
Transfer history list
3. Install Playwright browsers (one‑time)
bash
Copy
npx playwright install
4. Run tests locally
All tests
bash
Copy
npx playwright test
Run with UI (headed mode) for debugging
bash
Copy
npx playwright test tests/e2e/transfer-ui.spec.ts --project=chromium-regression --headed
Generate and view HTML report
bash
Copy
npx playwright test --reporter=html
npx playwright show-report
CI / CD – GitHub Actions
The workflow is defined in .github/workflows/playwright.yml and currently has two jobs:

Smoke (chromium)
Runs a small tagged subset (@smoke) against Chromium only.
Fast feedback on basic app and test health.
Regression (chromium + firefox)
Runs the full @regression suite against:
chromium-regression
firefox-regression
Uploads Playwright artifacts (videos, traces, HTML reports) for failed runs.
Key characteristics:

Matrix strategy for browsers.
Uses npx playwright install --with-deps in CI.
Test selection via --grep "@regression".
Design Choices and Testing Strategy
Resilient selectors
Prefer getByLabel and explicit id attributes over brittle CSS paths.
Avoids coupling to layout/CSS changes.
State‑based assertions
Instead of checking only UI text, tests assert on system invariants:
Sum of balances across accounts stays constant after any internal transfer.
Every transfer reflected exactly once in history.
Negative flows do not mutate balances or history.
Cross‑browser coverage
Same regression suite runs in Chromium and Firefox.
One E2E test is specifically hardened against differences in object key order and UI defaults.
Tag‑driven suites
Ensures scalability:
Fast smoke for every push.
Deeper regression on PRs / main branch.
How to Extend
Ideas for future expansion:

Add tests for:
Login validation errors.
Large transfer amounts and rounding behavior.
Introduce visual regression checks on critical views.
Parameterize accounts and amounts from external test data.
Credits
This test suite targets the Sample Banking App that is part of this repository.
All application logic (accounts, transfers, history) is owned and served from the src/ directory; Playwright tests are pure consumers of the exposed behavior.
# Smart Gym Management System

React + Vite staff app using Firebase Authentication and Cloud Firestore. This review branch combines the hosted screen layout with the Firebase customer flow preserved on `panha`. See the [Sprint 1 audit](docs/sprint-1-audit.md) for the deployed baseline and review findings.

## Run locally

Use Node.js 22 and npm. From the repository root:

```powershell
cd client
npm ci
npm run dev
```

Open the local Vite URL. The frontend uses the project configured in `src/firebase.js`. That configuration points to the real Firebase project, so use the emulator test commands below for synthetic data. Staff sign in with an existing Firebase account. Firestore must authorize customer reads before the staff area opens. The customer total and directory come from Firestore. Registration displays the saved document ID.

Subscription and attendance screens are labeled as demos. Customer editing, persisted visits and checkout/payment are tracked separately. The legacy Express/MySQL code under `server` and `database` is kept for reference and local regression tests. Running it requires a private `JWT_SECRET` of at least 32 characters and a separately provisioned local staff account. The hosted frontend has no Express dependency.

## Verify

Use the [manual test checklist](docs/manual-test-checklist.md) to check the review branch in a browser against local Firebase emulators.

```powershell
cd client
npm test
npm run build
firebase emulators:exec --project demo-smart-gym --config firebase.emulator.json --only auth,firestore "npm run test:emulator"
```

The emulator command requires the Firebase CLI and a supported Java installation. It uses an isolated demo project, synthetic Auth users and a test copy of the read/create authorization policy with a synthetic staff UID. The Hosting configuration is separate from emulator rules.

For the legacy API tests, run `npm install` and `npm test` in `server`. Tests bind to a temporary loopback port and use an unavailable loopback database rather than project data.

## Hosting

The live site is <https://smart-gym-team2.web.app>. GitHub Actions installs locked frontend dependencies, builds, and runs the unit tests for pull requests. The deploy step runs on pushes to `main` and manual runs on `main`, using the existing GitHub Actions secret and `client/firebase.json`. The deployed commit is published at <https://smart-gym-team2.web.app/version.json>. Firebase staff accounts and production rules are managed separately from Hosting. Do not commit deployment keys, reusable passwords, or real customer data.

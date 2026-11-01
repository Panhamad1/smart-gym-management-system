# Smart Gym Management System

React + Vite frontend with Firebase Authentication, Cloud Firestore, and Firebase Hosting.

Live site: https://smart-gym-team2.web.app

## Current scope

- Staff email/password login and logout using existing Firebase accounts. Remember me controls persistent versus browser-session authentication.
- Dashboard member count reflects stored customer documents; other dashboard metrics and check-in actions are prototype placeholders.
- Customers page lists stored records and searches by exact ID or partial name.
- Customer registration reports success only after Firestore confirms the write.

The planned next iteration models visits: register/check in, show customers currently inside, and record payment/checkout. That workflow is not implemented yet. Existing customer records remain stored.

## Run locally

Use Node.js 22.12+ and npm. From the repository root:

```powershell
cd client
npm ci
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173. Sign in with an existing authorized Firebase staff email/password. The old hardcoded demo accounts and local-storage sessions no longer grant access. New staff access must be configured in Firebase Authentication and the Firestore security rules.

The `server/` and `database/` folders contain the historical Express/MySQL prototype. They are not used by the hosted frontend. Local MySQL customer records are not automatically migrated to Firestore.

## Tests and build

```powershell
cd client
npm test
npm run build
```

The build writes `client/dist`, including `version.json` with the Git commit used to build the deployed site.

## Automatic deployment

`.github/workflows/firebase-hosting.yml` runs on every push to `main`, including PR merges, or from GitHub Actions using Run workflow. It installs from `client/package-lock.json`, runs tests, builds, and deploys the live channel for `smart-gym-team2`. Failed tests or builds stop deployment.

The workflow reads `client/firebase.json`. Its `public: dist` path is relative to `client`. The deployment service account is stored only in the GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_SMART_GYM_TEAM2`; never commit its JSON key.

Check deployment progress in the repository's Actions tab. After completion, https://smart-gym-team2.web.app/version.json identifies the deployed commit.

For a manual deployment using an authorized Firebase CLI login:

```powershell
cd client
npm ci
npm test
npm run build
firebase deploy --only hosting --project smart-gym-team2
```

## Data access

Firestore rules enforce the approved staff account. Hosting deployment does not change Authentication accounts or Firestore rules. An authenticated account without customer permissions sees an access error rather than a fabricated count. Optional empty contact fields are omitted to match the existing rules.

For this small prototype, a realtime listener reads the customers collection to power the list and total count. Larger deployments should use paginated queries and a dedicated aggregate count.

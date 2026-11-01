# Smart Gym Management System

React + Vite UI prototype deployed through GitHub Actions to Firebase Hosting.

Live site: https://smart-gym-team2.web.app

## Current scope

- Hosted screens use the version from `feature/SCRUM-14-login-and-dashboard`, commit `22d95d5`.
- Staff login includes Firebase, local Express, and seeded demo-account paths.
- Dashboard metrics and customer-directory rows are sample data. New rows added during a session are prototype UI state, not proof of database persistence.
- The customer's membership/status columns and search follow the friend's customer-management screen design.

The Firebase-only version with database-backed counts and confirmed writes is preserved on the `panha` branch at `55113da`. Deployments continue to follow `main`; `panha` is preserved for later development.

The planned next iteration models visits: register/check in, show customers currently inside, and record payment/checkout. That workflow is not implemented yet. Existing customer records remain stored.

## Run locally

Use Node.js 22.12+ and npm. From the repository root:

```powershell
cd client
npm ci
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173. The login screen provides demo quick-fill buttons. Existing Firebase staff accounts can also sign in. Firestore still enforces its published staff permissions; demo sign-in does not grant Firestore access.

The `server/` and `database/` folders contain the local Express/MySQL prototype. The hosted frontend attempts localhost API calls before falling back, but Firebase Hosting does not deploy that server. Local MySQL records are not automatically migrated to Firestore.

## Build

```powershell
cd client
npm run build
```

The build writes `client/dist`, including `version.json` with the Git commit used to build the deployed site.

## Automatic deployment

`.github/workflows/firebase-hosting.yml` runs on every push to `main`, including PR merges, or from GitHub Actions using Run workflow. It installs from `client/package-lock.json`, builds, and deploys the live channel for `smart-gym-team2`. Failed builds stop deployment.

The workflow reads `client/firebase.json`. Its `public: dist` path is relative to `client`. The deployment service account is stored only in the GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_SMART_GYM_TEAM2`; never commit its JSON key.

Check deployment progress in the repository's Actions tab. After completion, https://smart-gym-team2.web.app/version.json identifies the deployed commit.

For a manual deployment using an authorized Firebase CLI login:

```powershell
cd client
npm ci
npm run build
firebase deploy --only hosting --project smart-gym-team2
```

## Data access

Firestore rules enforce the approved staff account. Hosting deployment does not change Authentication accounts, Firestore rules, or stored records. This hosted prototype can display success/local rows even if persistence fails; the Firebase-only implementation on `panha` fixes that behavior.

Do not use the prototype's sample member counts or customer rows as database reports. The planned visit/check-in/payment/checkout workflow is still deferred.

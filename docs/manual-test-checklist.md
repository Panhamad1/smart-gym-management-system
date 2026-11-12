# Smart Gym manual test checklist

Run these checks on the review branch from draft PR #7. The public site serves a different build until the changes are approved and merged.

## Start an isolated test environment

Use Node.js 22, npm, Firebase CLI and a Java version supported by the Firestore emulator. From the repository root, run this in the first PowerShell terminal and leave it open.

```powershell
cd client
npm ci
firebase emulators:start --project demo-smart-gym --config firebase.emulator.json --only auth,firestore
```

Run this in a second terminal. The seed command prints passwords generated for two synthetic accounts on your computer. Keep this terminal output for the test session. Running the command again resets only those two local test passwords.

```powershell
cd client
npm run seed:emulator
npm run dev:emulator
```

Open [the local test app](http://127.0.0.1:5174). Use only synthetic names and contact details. The dedicated Vite mode connects to loopback Auth and Firestore for the demo project. The regular dev command uses the configured Firebase project.

## Browser tests

| Jira item | Steps | Expected result |
| --- | --- | --- |
| SCRUM-31 · Signed-out access | Open the test app in a private window. Refresh before signing in. | The login form is shown. Customer data and staff pages are hidden. |
| SCRUM-31 · Incorrect password | Enter `staff@example.test` with a deliberately incorrect password. | An invalid email or password error appears. The dashboard stays hidden. |
| SCRUM-31 · Unapproved account | Sign in as `unapproved@example.test` using its generated password. | The app shows that the account lacks customer access. The staff area stays hidden and the page offers sign-out. |
| SCRUM-31 · Approved account | Sign out and sign in as `staff@example.test` using its generated password. | The dashboard opens after checking customer access. |
| SCRUM-31 · Session | Sign in without Remember me and refresh. Open the test URL in a separate private window. Then sign out and refresh the original tab. | The original tab keeps the session across refresh until logout. The new private window asks for login. Logout returns the original tab to login. |
| SCRUM-32 · Empty directory | On a fresh emulator run, open Customers before saving a record. | A zero total and a clear empty state appear. |
| SCRUM-32 · Required name | Choose Add Customer, enter only whitespace in the name, and submit. | Validation rejects the name. The form keeps the entered values and the count stays the same. |
| SCRUM-32 · Optional fields | Register `Sample Alice` with blank phone and email. Copy the ID shown in the success message. | The saved ID is shown and the directory adds one row. Blank contact fields are accepted. |
| SCRUM-32 · Unique IDs and search | Register another `Sample Alice`. Search for `aLiCe`, then search for the first ID, then a name that does not exist. | Name search shows both records with different IDs. ID search shows only the first record. The last search shows an empty result. |
| SCRUM-32 · Persistence and count | Clear search, compare the directory total with the dashboard customer count, then refresh. | Both totals agree and the records remain. |
| SCRUM-24 · Demo metrics | Compare the real customer count with subscription and visit cards. | The unimplemented metrics are identified as samples. |

## Automated checks

From `client`, run `npm test` for customer validation and search and `npm run build` for a production build. For isolated Firebase checks, stop the manually started emulators first, then run:

```powershell
firebase emulators:exec --project demo-smart-gym --config firebase.emulator.json --only auth,firestore "npm run test:emulator"
```

The suite covers valid and invalid login, sign-out, separate IDs for customers with the same name, fresh-client reads, denied reads and writes, and the manual test accounts. From `server`, run `npm test` for the legacy API checks. These verify missing signing-secret handling, anonymous request rejection, and the response when the local database is unavailable.

## Figma prototype

Open the [Staff Login frame](https://www.figma.com/design/yPHukVs5VbGyT4LXg2n6Tx/smart-gym-managements--Copy-?node-id=1-2) and click Present. Select the flow that starts on Staff Login.

1. Click Login. The Dashboard should open.
2. Click Customers. Customer Management should open.
3. Click Dashboard. You should return to Dashboard.
4. Click Log out from Dashboard. You should return to Staff Login.
5. Go through Login and Customers again. Click Log out from Customers and confirm that Staff Login opens.

This test checks prototype navigation. Use the local test app above to test credentials and customer persistence.

## Record results

For each case, record the commit, date, expected result, actual result, and Pass or Fail in SCRUM-25. Use screenshots with synthetic records only. SCRUM-32 tracks the release decision, and SCRUM-33 tracks Figma and Sprint 1 evidence. Customer editing, persisted visits, checkout, payments, and subscriptions need separate tests once their scope is confirmed.

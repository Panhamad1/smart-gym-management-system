# Smart Gym manual test checklist

Use the live site to verify sign-in and read existing records. Use the local Firebase emulators for synthetic registrations, denied access and offline tests.

## Check the hosted site

1. Open [Smart Gym](https://smart-gym-team2.web.app) in a private window. Confirm the Staff Login form opens.
2. Enter your approved Firebase staff email with an incorrect password. Confirm the app shows an error and stays on Staff Login.
3. Enter the correct password. Confirm Dashboard opens and shows the registered customer count.
4. Open Customers, then choose All customers. Search for an existing customer by part of their name and by their full ID. Clear the search and check the total against Dashboard.
5. Refresh, open Customers, choose All customers again, and verify the same saved records appear. Click Log out and confirm that refreshing stays on Staff Login.
6. Use Dashboard → New walk-in on the hosted site when a real customer arrives and is ready to check in. For practice, use the emulator instructions below. The live rules deny customer deletion.

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
| SCRUM-32 · Empty directory | On a fresh emulator run, open Customers → All customers before saving a record. | A zero total and a clear empty state appear. |
| SCRUM-32 · Required name | Choose Dashboard → New walk-in, enter only whitespace in the name, and submit. | Validation rejects the name. The form keeps the entered values and the count stays the same. |
| SCRUM-32 · Optional fields | Check in `Sample Alice` with blank phone and email. Open Customers → All customers and copy the ID from the new row. | The visit opens and the directory adds one row. Blank contact fields are accepted. |
| SCRUM-32 · Unique IDs and search | Check in another synthetic customer named `Sample Alice`. Search for `aLiCe`, then search for the first ID, then a name that does not exist. | Name search shows both records with different IDs. ID search shows only the first record. The last search shows an empty result. |
| SCRUM-32 · Persistence and count | Clear search, compare the directory total with the dashboard customer count, then refresh. | Both totals agree and the records remain. |
| SCRUM-32 · Offline save | While signed in locally, open Dashboard → New walk-in. Switch the browser to Offline in DevTools, then submit a valid synthetic record. Switch back online and search for that name before retrying. | The form shows an offline error and preserves the name and contact details. No row is saved on reconnect. Clicking Check in again while online saves the customer and opens the visit. |
| SCRUM-32 · Sprint 1 controls | Check the Dashboard and sidebar. | Dashboard shows the actual customer count. Staff can open Customers, start a walk-in check-in, or log out. The sidebar and dashboard also show the planned features and metrics without simulated data. |

## Sprint 2 walk-in tests

Use the isolated test environment above and sign in as `staff@example.test`.

| Jira item | Steps | Expected result |
| --- | --- | --- |
| SCRUM-16 · New walk-in | Open Check-in, enter `Sample Walk-in` under New customer, and select Check in. Open Open Visits and refresh. | One active visit appears with the customer name and Cambodia check-in time. Customers shows the same person as In gym. |
| SCRUM-16 · Duplicate visit | Open Check-in, choose Returning customer, search for `Sample Walk-in`, select the existing record, and submit. | The app says the customer is already checked in. Open Visits still has one visit for that customer. |
| SCRUM-17 · Unpaid checkout | In Open Visits, choose Check out and select Cash without confirming receipt of payment. | The amount is $2.00 USD and the confirmation button stays disabled. The visit stays open. |
| SCRUM-17 · Paid checkout | After simulating a cash payment, check I received the payment and confirm. Open Payments and refresh. | The customer disappears from Open Visits and the In gym label clears. Payments shows one $2.00 USD Cash entry. |
| SCRUM-17 · Return visit and bank payment | Check the same customer in using Returning customer. Check out with Bank transfer and confirm receipt. | The new visit closes and Payments shows a separate $2.00 USD Bank transfer entry. |
| Customer navigation | Open Customers. Use New walk-in to register and check in. From In gym, select Check out. After paid checkout, switch to All customers, search for that person, and select Check in. | Checkout opens with the active visit selected. After checkout, the row disappears from In gym. Check in opens the returning-customer form with the existing customer selected. |
| Visit history | Complete a paid walk-in. Open Open Visits → Visit history and refresh. | The completed visit shows the customer, Cambodia-local check-in and checkout times, visit ID, and payment amount and method. |
| SCRUM-17 · Concurrent checkout | Use two signed-in browser sessions. Open checkout for the same active visit in both. Confirm in one, then submit the stale form in the other. | The second cashier sees that the visit is no longer open. Payments contains a single entry for that visit. |

## Automated checks

From `client`, run `npm test` for customer validation and search and `npm run build` for a production build. For isolated Firebase checks, stop the manually started emulators first, then run:

```powershell
firebase emulators:exec --project demo-smart-gym --config firebase.emulator.json --only auth,firestore "npm run test:emulator"
```

The suite covers login, customer persistence and permissions, plus walk-in persistence, concurrent check-in and checkout, and rejection of invalid or partial checkout writes. From `server`, run `npm test` for the legacy API checks. These verify missing signing-secret handling, anonymous request rejection, and the response when the local database is unavailable.

## Figma prototype

Open the [Staff Login frame](https://www.figma.com/design/yPHukVs5VbGyT4LXg2n6Tx/smart-gym-managements--Copy-?node-id=1-2) and click Present. Select the flow that starts on Staff Login.

1. Click Login. The Dashboard should open.
2. Click Customers. Customer Management should open.
3. Click Dashboard. You should return to Dashboard.
4. Click Log out from Dashboard. You should return to Staff Login.
5. Go through Login and Customers again. Click Log out from Customers and confirm that Staff Login opens.

This test checks prototype navigation. Use the local test app above to test credentials and customer persistence.

## Record results

Record Sprint 1 cases in SCRUM-25 and walk-in cases in SCRUM-16 or SCRUM-17. Include the commit, date, expected result, actual result, and Pass or Fail. Use screenshots with synthetic records only. SCRUM-32 tracks the Sprint 1 release decision, and SCRUM-33 tracks Figma and Sprint 1 evidence.

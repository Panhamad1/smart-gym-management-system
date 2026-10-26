# SCRUM-3 — Firebase prototype and acceptance verification

## Current deployed architecture
- React + Vite frontend deployed on Firebase Hosting: https://smart-gym-team2.web.app
- Firebase Authentication email/password staff sign-in and sign-out.
- Cloud Firestore `customers` collection: generated document ID, required `name`, optional `phone` and `email`, server timestamp `createdAt`.
- Client reads customers via Firestore SDK and filters by exact ID or case-insensitive partial name.
- Express/MySQL code in the repository is legacy and is **not** used by the hosted customer-registration screen.

## Local setup
1. In `client/`, run `npm ci`, then `npm run dev`.
2. Use an existing authorized Firebase Authentication staff account. Never commit staff credentials.
3. `npm run build` before deployment.
4. Deploy with `firebase deploy --only hosting --project smart-gym-team2` from the directory containing `firebase.json`.

## Manual acceptance checklist
- [ ] Authorized staff can log in; sign out returns to the login form.
- [ ] Blank or whitespace-only name is rejected without losing entered data.
- [ ] Name at most 120 characters; optional phone at most 30 and email at most 254 characters.
- [ ] Successful registration shows a generated unique customer ID.
- [ ] Search by ID and by case-insensitive partial name finds saved records.
- [ ] Search with no match shows a clear empty state.
- [ ] Browser refresh preserves saved customers.
- [ ] Two customers with the same name receive distinct IDs.
- [ ] Unauthenticated and unauthorized users cannot read or create customers in Firestore.
- [ ] No real customer personal data is used during the demo.

## Evidence / review status
Developer reported local and hosted registration, search, persistence, and sign-out working on 26 October 2026. These are **developer-reported manual results**, not independently verified automated test results. PR #3: https://github.com/Panhamad1/smart-gym-management-system/pull/3 ; Jira: https://chensovanpanha.atlassian.net/browse/SCRUM-3 .

## Firestore security rules (important)
The currently published production rules were configured directly in Firebase Console and are **not included here**, because the exact published rules and staff UID have not been retrieved and verified. Before changing/deploying rules, export the actual rules from Firebase Console into a tracked `firestore.rules` file, review them, and test with both approved and unapproved accounts. Do not replace working rules with a permissive example. Staff authorization must be enforced in Firestore rules, not only the React login screen.

## Known limitations
- Client-side filtering downloads all customers, suitable for a small demo only.
- Form validates the name length; phone/email max lengths are enforced by HTML input and Firestore rules. Additional application-level validation and tests are desirable.
- Firebase Authentication and Firestore access currently support a limited authorized staff account; teacher access requires explicit approval.
- The repository's original Express/MySQL architecture notes need migration or archival.

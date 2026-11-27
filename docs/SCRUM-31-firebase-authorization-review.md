# SCRUM-31 — Firebase staff authorization security review

Status: AI-assisted source/code review plus local emulator checks, NOT live-production staff acceptance.

## Intended access boundary
The web application signs users in with Firebase email/password and uses Auth sign-out/persistence. Firestore must authorize the UID separately. The emulator policy deliberately approves only synthetic UID emulator-approved-staff; it is not production-approved policy.

## Checks to perform
1. Approved synthetic staff can read customers, walk-ins, plans, subscriptions and payment history.
2. Signed-out and unapproved clients cannot read or write customer or membership records.
3. Invalid Firebase Auth password is rejected; sign-out clears session.
4. A client cannot edit createdAt, archived identity, currency, purchase amount, arbitrary role, plan history or receipt.
5. Duplicate/open visit and duplicate checkout are denied. Unauthorized writes never create partial purchase/receipt records.
6. Verify the legacy Express server rejects missing JWT signing secrets and contains no hardcoded demo staff credentials.

## Source evidence
- client/src/main.jsx — Firebase Auth staff login.
- client/tests/firebase.emulator.mjs — login, approved and unauthorized customer access.
- client/tests/membership.emulator.mjs — membership/visit/payment permissions.
- client/tests/firestore.emulator.rules — **synthetic emulator-only** policy.
- server/src/index.js and server/.env.example — legacy backend reference (live React site does not depend on it).

## Real production release blockers
- Export the live Firestore rules and identify the actual approved staff UID allowlist.
- Confirm authorized staff sign-in and denial for unapproved test users on the deployed site.
- Do not replace live rules with synthetic emulator rules or use allow read/write: if true.
- Ensure no demo credentials or JWT secrets are committed or exposed.

No production access change or security approval is implied by these automated checks.
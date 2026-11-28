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

## Additional emulator security findings — 28 November 2026

- New Firestore rule `cambodiaStartOfDay` binds stored entitlement `coveredFromAt` and `paidThroughAt` to Cambodia midnight, rather than trusting arbitrarily provided timestamps. This prevents a client from showing an expiry in December but secretly granting another year through a forged timestamp.
- Purchase-period dates must represent a duration between **28 and 31 days per calendar month of the plan**, preventing a forged 10-year entitlement for a one-month purchase. The client calculates the **exact** calendar-month expiry and tests February/January boundaries. **Important limitation:** a 28–31-day bound is not an exact equivalent to all calendar-month rules. Stronger server-enforced expiry calculation/immutable money accounting would require an approved trusted backend, not just relying on staff-entered client data.
- Emulator regression tests deliberately bypass the React form to attempt the above writes as an **approved staff UID**. Rejection is verified in GitHub Actions. Synthetic emulator rules are not published to production.
- For returning customers, the staff UI defaults to a covered entry when an active membership is confirmed and prevents paid check-in until the entitlement collection has loaded. Staff can deliberately choose paid walk-in only with verified membership status.
- Check the newest PR #16 head run before claiming final evidence. As before, actual production Firestore policy review and authorized/unapproved signed-in browser checks remain mandatory.

## Real production release blockers
- Export the live Firestore rules and identify the actual approved staff UID allowlist.
- Confirm authorized staff sign-in and denial for unapproved test users on the deployed site.
- Do not replace live rules with synthetic emulator rules or use allow read/write: if true.
- Ensure no demo credentials or JWT secrets are committed or exposed.

No production access change or security approval is implied by these automated checks.
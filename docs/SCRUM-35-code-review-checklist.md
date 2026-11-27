# SCRUM-15 / SCRUM-34 / SCRUM-35 / SCRUM-42 — Code Review and Acceptance Checklist

Date: 2026-11-27. Reviewed with an AI assistant; **not a substitute for an independent team member or Product Owner's sign-off**.

## Review scope

- **PR #13**: same-name walk-in selection and phone/reference lookup
- **PR #15**: customer profile edit form, safe Firestore edits, visit/payment history links and checkout identification
- **PR #14**: subscription domain calculations only; no functional payment or subscription management screens yet

## Confirmed from GitHub source

- The immutable Firestore customer document ID remains the authoritative key.
- Short display references can grow if another ID shares their prefix; they are staff lookup hints **not guaranteed permanent printed card numbers**.
- Phone is recommended, not required or unique; siblings/family can share a phone.
- Profile updates modify the existing customer document. They do not change document ID, creation timestamp, or historical visit/payment documents.
- Staff must explicitly confirm the matching customer on returning walk-in **check-in and checkout**.
- Customer details provide links to that exact customer's completed visits and walk-in payments, filtered by immutable customer ID.
- The new profile-update permission lives in `client/tests/firestore.emulator.rules`; this is **not the published production policy**.

## Automated checks

The pull-request workflow executes:
- `cd client && npm ci`
- `cd client && npm run build`
- `cd client && npm test`
- `cd client && npx --yes firebase-tools@14 emulators:exec --project demo-smart-gym --config firebase.emulator.json --only auth,firestore "npm run test:emulator"` (Java 21)

Inspect the most recent PR #15 GitHub Actions run for actual pass/fail status. Tests include approved versus unauthorized Firestore edits, forbidden changes to immutable fields, invalid emails, rejected archived/missing records, refresh persistence and historical visit integrity. **Do not record these as passed until the latest run is green.**

## Manual acceptance scenarios — pending human execution

Use a local emulator with synthetic customers; do not edit real customer records.

1. Create two customers named Sokha with different phone numbers. Search by name: both appear separately with different references and phone endings.
2. Create two customers with the same name and the same phone. Verify neither is merged and the correct ID is used for check-in.
3. Create a customer without a phone. Confirm the search UI offers a reference and advises staff to verify identity.
4. Try returning check-in without ticking identity confirmation: it must not submit. Tick it and verify the correct customer's open visit.
5. Try checkout for two same-name customers. Confirm the selected reference/phone hint and require separate identity confirmation and payment-received confirmation.
6. Edit one customer's name, phone and email, then reload: changes persist on the same ID. Check that old completed visit/payment snapshots remain linked to that ID.
7. From the customer editor, open **View visit history** and **View payment history**; verify each page filters by customer ID, not name.
8. Verify unauthorized Firebase users cannot read or edit customers. Verify direct Firestore attempts to modify `createdAt`, `role`, arbitrary fields, or a malformed email fail.
9. Check missing/archived customer edits give a clear error.
10. Check narrow mobile viewport and keyboard focus in identity checkbox/confirmation and the customer editor.

Record tester, date, screenshots or logs, expected/actual outcomes and links here before approval.

## Production-release blockers

1. Export and review the **existing live** Firestore rules, preserving the approved staff UID allowlist and walk-in access policies. Do not upload the synthetic emulator rules to production.
2. Add the narrowly scoped validated profile-update policy to the actual live rules. Obtain Product Owner/team approval and test authorization with an approved test account and an unapproved account.
3. Review PR #13 first. PR #15 contains its commits, and must be merged/rebased in dependency order to avoid duplicate implementation.
4. Merge to `main` only after the production-rules rollout and a teammate/PO approve the complete behavior. A merge triggers Firebase Hosting deployment automatically.
5. Verify the actual live build SHA at `https://smart-gym-team2.web.app/version.json` after deployment.

## Sprint 3 remaining functionality

Membership purchase/renewal, linked subscription payments, subscription-covered check-in/out, subscription attendance reports, dashboard subscription counts, and wider Sprint 3 evidence/retrospective tasks are **not completed** by these PRs. Never mark these tasks Done based on subscription domain utilities alone.

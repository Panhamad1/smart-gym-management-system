# SCRUM-25 — End-to-end acceptance tests and evidence

Scope: Firebase Auth, customer records, walk-ins, membership purchase/renewal, manual payments, subscription visits, reporting. Date: 28 November 2026.

## Automated evidence
PR #15: https://github.com/Panhamad1/smart-gym-management-system/pull/15 (customer edits/authorization).
PR #16: https://github.com/Panhamad1/smart-gym-management-system/pull/16 (membership lifecycle).
GitHub Actions includes npm ci, npm run build, npm test, and Firebase Auth/Firestore emulator integration tests. **Only count a run as passing when its latest commit has a green conclusion.** Earlier passing PR runs do not verify later code.

## Acceptance scenarios / test ownership

| Scenario | Automated check | Manual end-to-end verification |
|---|---|---|
| Correct/wrong Firebase staff login and logout | Existing Auth emulator test | Pending signed-in browser test |
| Signed-out/unapproved data denial | Existing and Sprint 3 emulator tests | Pending production approved/unapproved accounts |
| Same-name customer records, search and refresh | Customer-data and emulator tests | Pending browser |
| Create customer and walk-in, prevent duplicate entry | Existing walk-in emulator tests | Pending browser |
| Walk-in checkout requires manual $2 payment; duplicate rejected | Existing walk-in emulator tests | Pending browser |
| Edit profile, preserve ID and history, deny bad fields | SCRUM-35 emulator tests | Pending browser and production permission review |
| Create/update/inactivate plans; historical price snapshot | Sprint 3 emulator tests | Pending browser |
| Record purchase/renewal with single linked payment | Sprint 3 emulator tests | Pending browser with synthetic data |
| Valid member covered entry and $0 checkout | Sprint 3 emulator tests | Pending browser |
| Expired/future/missing/inactive membership blocked from covered entry | Domain unit tests and missing-state test; further emulator expiry case desirable | Pending browser |
| Same-name member records and competing visit types | Sprint 3 emulator tests | Pending browser |
| Unified payments, attendance, and active/expired dashboard | Domain/UI source review; browser case pending | Pending browser |
| Offline/error cases | Existing offline test and new forms | Pending browser/simulated errors |

## Verified GitHub Actions result — 28 November 2026

- **Run:** https://github.com/Panhamad1/smart-gym-management-system/actions/runs/46055475541
- **Head commit tested:** `d433da30db028c7d864b02ece2765d383be34ca1`
- **Outcome:** success (deploy job); the production deployment step was correctly skipped on this pull-request branch.
- **Frontend:** `npm ci`, `npm run build` succeeded.
- **Unit tests:** 19 passed, 0 failed.
- **Firebase Auth/Firestore emulator integration tests:** 15 passed, 0 failed.
- **Synthetic seed:** `npm run seed:memberships:emulator` ran successfully within the same emulator session. It created example monthly/yearly plans, two distinct same-name customers, a paid membership, a member visit with no new payment, and one $2 paid walk-in.
- **Environment:** GitHub Actions Node.js 22, Java 21, Firebase emulator project `demo-smart-gym`. The tests did not touch live Firebase records.

The test results above are real automated evidence; **not** a claim of live UI/browser acceptance, independent teammate approval, payment handling in production, or actual team sprint-review attendance.

## Actual results
Record the latest test-run URL and pass/fail counts here only after CI finishes. Do not invent screenshots, customer interviews, teacher approval or test outcomes.

## Known blockers for final Done
Review and safely publish the real Firestore rules, approved staff UID and deployment; then run signed-in browser acceptance against a **synthetic** test set. Request human teammate + PO confirmation. Keep incomplete Jira tasks open until these steps occur.
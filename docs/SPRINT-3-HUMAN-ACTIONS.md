# Sprint 3 — Human acceptance and release checklist

**Prepared:** 28 November 2026 · **Status:** actions NOT completed until a real owner records evidence. This is an assignment/checklist, not a fabricated meeting, approval, test run or live release.

The implemented candidate is [PR #16](https://github.com/Panhamad1/smart-gym-management-system/pull/16), stacking [PR #13](https://github.com/Panhamad1/smart-gym-management-system/pull/13), [PR #15](https://github.com/Panhamad1/smart-gym-management-system/pull/15), and the subscription date logic of [PR #14](https://github.com/Panhamad1/smart-gym-management-system/pull/14). **All remain review candidates.** Keep production on the already working main branch until the policy + human checks below succeed.

## 1. Product Owner — Mao Posovandeth (SCRUM-12)

- [ ] Confirm customer identity fields: name required, phone recommended but not unique, same-name customer matching verified using reference and masked phone hint.
- [ ] Confirm walk-in fee $2 USD, example membership prices $50/month and $500/year, whether zero-cost plans are allowed, allowed payment methods, and what counts as *payment received*.
- [ ] Confirm Cambodia-local calendar month duration: starts today, the expiry day is **excluded**, month-end clipping (Jan 31 → Feb 28/29), active renewal extends from the current expiry, expired renewal starts today.
- [ ] Confirm expired/future/inactive members may purchase a walk-in visit but do not receive a covered visit.
- [ ] Confirm one open visit total per customer, no extra payment at subscription-covered checkout, and approved staff allowed to manually confirm cash/bank payments.
- [ ] Read and approve the proposed Sprint Goal, scope and Definition of Done in [SCRUM-12 policies](./SCRUM-12-mvp-policies.md).
- [ ] After a *real demonstration*, accept/reject each story and record feedback. Do not simply say 'approved' without checking results.

**Evidence to attach to Jira SCRUM-12:** date, PO name, checklist decisions, comments/meeting notes, approved policies and exceptions.

## 2. Firebase project administrator / developer — Chen + a second reviewer (SCRUM-31, SCRUM-32, SCRUM-35, SCRUM-25)

- [ ] Export / copy the actual **published production Firestore rules** and check the approved Firebase Auth staff UID allowlist. A newly created Auth user is not automatically allowed to access customers.
- [ ] **Never publish** `client/tests/firestore.emulator.rules` directly. It contains the synthetic UID `emulator-approved-staff` and is designed only for local tests.
- [ ] Review a production-rule migration preserving the existing staff allowlist, existing walk-in receipts, customer archives and existing data; add only the reviewed profile, plans, subscriptions, payments and member-visit permissions.
- [ ] In a **separate demo/test environment** with synthetic customer IDs, verify an approved staff account can access customers and correctly perform edits, plans, payment/purchase, member check-in/out, reports. Verify signed-out and an unapproved account cannot read/write these collections.
- [ ] Verify malicious direct Firestore writes (wrong amount/status, forged payment, modified creation date, expired membership, duplicate check-in, duplicate checkout, archived customer write) fail.
- [ ] Record test account UIDs privately as needed, **not** passwords, private keys or real customer personal data in GitHub/Jira.
- [ ] Agree a rollout sequence: permission changes and site release coordinated so existing staff functions stay available. Have a tested rollback for both Firestore Rules and Hosting.
- [ ] After approved merge and deploy, check `https://smart-gym-team2.web.app/version.json` against the deployed commit SHA and hard-reload the site.
- [ ] Verify login, registration/search/refresh, same-name customer check-in, checkout, subscription sale/renewal, attendance, payment views, sign-out on actual desktop/mobile screens; record expected/actual results and screenshots using **synthetic** accounts only.

**Evidence:** exported rules version (no secrets), exact new approved policy commit/version, reviewer, before/after tests, Hosting SHA, timestamped screenshots and Jira SCRUM-25 checklist.

## 3. Human code / design reviewer — another developer + Yann Sokmeng (SCRUM-13, SCRUM-15, SCRUM-18–21, SCRUM-33, SCRUM-41)

- [ ] Review PR #13, #14 and #15 before PR #16; note PR #15 already contains PR #13's commits, and PR #16 contains #15 plus the subscription date domain. Do not merge overlapping branches blindly.
- [ ] Review transaction rules and test evidence, including same-name/shared-phone and no-phone customers, renewal coverage, duplicate payments, security boundaries and date boundaries.
- [ ] Give **actual human GitHub reviews**; do not treat AI comments or passing CI as independent approval.
- [ ] Open the shared [Figma](https://www.figma.com/design/yPHukVs5VbGyT4LXg2n6Tx/smart-gym-managements--Copy-?node-id=1-2), verify teacher/reviewer access and compare screen flows and mobile layouts. Record any differences and whether they are acceptable.
- [ ] Confirm the Sprint 1 design handoff, teacher agenda and required submission receipt; link real evidence to SCRUM-33.

**Evidence:** GitHub review URL(s), reviewer names, Figma review notes/screenshots, Jira comments. Never invent a meeting date or teacher approval.

## 4. Scrum Master — Yann Sokmeng (SCRUM-28, SCRUM-33)

- [ ] Schedule and conduct the actual Sprint 3 Review and Retrospective with the team/PO.
- [ ] Demo only stories that passed agreed acceptance tests and are actually released; keep known gaps visible.
- [ ] Record actual date, attendees, observed feedback, stories accepted/rejected, Sprint Goal outcome, and one agreed improvement action + owner.
- [ ] Link real review/retro notes and the teacher submission receipt. A draft agenda alone does **not** satisfy SCRUM-28 or SCRUM-33.

**Evidence:** real meeting notes, PO decisions, backlog adjustments, improvement task and owner, teacher/Moodle receipt.

## Evidence and closeout protocol

Jira key must appear in the GitHub branch or commit message and PR title/body; add the specific commit/PR/check-run URL to each Jira issue. Non-code Jira items get genuine committed documentation, not empty commits. Mark an issue **Done only after** its criteria are satisfied with recorded evidence; teacher/PO sign-off cannot be simulated. **Do not close Sprint 3** while acceptance, production security or actual review tasks are missing.

**Automated evidence already available:** [run 46055710414](https://github.com/Panhamad1/smart-gym-management-system/actions/runs/46055710414) — 19 unit tests, 15 local Firebase emulator tests, synthetic seed passed. This is **not** proof of signed-in live-site acceptance. Record newer head checks before merging.

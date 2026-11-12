# Smart Gym Sprint 1 audit

**12 November 2026, Cambodia time.** Scope includes the closed sprint, the live release, both remote branches, and the proposed review branch. Jira Done is a historical status. Test results are attributed to the version and environment that were tested.

## Sprint 1 audit

Jira board 1 shows Sprint 1 closed with six Done issues and 19 estimated points. The planned window was 26 October to 1 November, with closure on 2 November. The goal included walk-in check-in and checkout/payment. The code shows a demo check-in and open-visit list without persisted visit/checkout/payment behavior, so the full goal was not demonstrated. [Jira board](https://chensovanpanha.atlassian.net/jira/software/projects/SCRUM/boards/1)

| Issue | Pass or partial evidence | Fail or missing | Could not verify |
| --- | --- | --- | --- |
| [SCRUM-30](https://chensovanpanha.atlassian.net/browse/SCRUM-30) Foundation | Repository contains a lockfile, React/Vite setup, example config and Hosting workflow. README identifies the hosted prototype and legacy stack. PRs #1, #4 and #6 document implementation. | Main still relies on mixed Firebase/demo/local API paths. Public demo credentials and a default legacy signing key fail the credential criterion. | Another teammate's clean setup and review at Sprint 1 close. |
| [SCRUM-3](https://chensovanpanha.atlassian.net/browse/SCRUM-3) Customers | Required name, optional contact fields, UI search and an empty state exist. PRs #2–4 show migration work. Live signed-out Firestore reads returned 403. | Main displays sample rows and increments its sample total even when saves fail. Local IDs replace the returned Firestore ID. Refresh/search do not reload saved records. Editing is absent and current rules deny updates. The live policy was not versioned with the app. | Sprint 1 signed-in persistence, separate same-name customer records, unapproved account behavior and teammate review. The developer's earlier demo report is historical evidence. |
| [SCRUM-14](https://chensovanpanha.atlassian.net/browse/SCRUM-14) Staff access | Login, generic error and sign-out UI exist. PR #5 and its commits show Express middleware and bcrypt usage. Live Firestore access is enforced by rules. | Main embeds demo passwords and accepts browser storage as a staff session. The legacy API accepts a built-in signing key and seeded accounts. Static frontend hosting cannot run localhost API calls. | Successful and failed Sprint 1 login evidence and session invalidation at close. |
| [SCRUM-26](https://chensovanpanha.atlassian.net/browse/SCRUM-26) Test, deploy, document | Hosting serves main commit `5a09e9e` and has a successful deployment run. README and deployment URL exist. Firebase hosting replaces the earlier Express/MySQL plan. | Hosted app is a prototype. It does not provide reliable data persistence or safe demo credential handling. The production workflow currently builds and deploys without customer tests. | Sprint 1 fresh-browser acceptance run, submission build and teammate review. |
| [SCRUM-29](https://chensovanpanha.atlassian.net/browse/SCRUM-29) Figma | PRs and commit messages reference Figma screens. This confirms a design reference was used for some UI work. | Jira lacked the shared prototype URL, exports and recorded handoff. | Reviewer access, full screen/state coverage, clickable walk-in and subscription journeys, pricing labels, exclusions and feedback. |
| [SCRUM-27](https://chensovanpanha.atlassian.net/browse/SCRUM-27) Review and retrospective | Repository, Jira and live-product links exist. The ticket checks off link collection. | Agenda, verified story walkthrough, receipt and retrospective evidence are missing from the audited records. SCRUM-28 tracks follow-up. | Actual presentation, teacher access, Moodle submission/time, feedback and retrospective outcome. |

The [Definition of Done](https://chensovanpanha.atlassian.net/browse/SCRUM-12) requires accepted criteria, test evidence, integrated behavior, a reviewed PR, updated documentation and PO verification. The available Sprint 1 evidence does not establish full completion for these six issues.

## Problems found

| Priority | Finding | Follow-up |
| --- | --- | --- |
| P0 | Demo authentication bypass and publicly committed legacy credential defaults | SCRUM-31, SCRUM-39 |
| P0 | Customer save can report success even on failure. Main can show invented records and totals. | SCRUM-32, SCRUM-25 |
| P1 | Current staff rule is restricted to one approved UID and allows customer reads/creates only. Updates require reviewed access rules. | SCRUM-31, SCRUM-15, SCRUM-35 |
| P1 | Check-in/open visits, checkout, payment and subscriptions are demo or absent. Dashboard stats beyond customer total lack stored sources. | SCRUM-16–24 |
| P1 | Closed ticket acceptance evidence and teacher submission/design artifacts are missing. | SCRUM-25, SCRUM-32, SCRUM-33, SCRUM-28 |
| P2 | Stale SQL/Express instructions, misleading review statuses, overlapping plan and payment scope. | Backlog cleanup and SCRUM-13 |

**Version comparison.** Live `5a09e9e` matches remote `main`. Remote `panha` at `55113da` already has Firebase-only authentication, a Firestore listener and five customer data tests. It uses a different customer table and lacks a generated-ID success message. Both contain sample attendance/subscription metrics. The candidate retains main's screen layout and reuses the Firebase behavior from panha. [Hosted version](https://smart-gym-team2.web.app/version.json) · [PR #5](https://github.com/Panhamad1/smart-gym-management-system/pull/5) · [PR #6](https://github.com/Panhamad1/smart-gym-management-system/pull/6) · [Hosting run](https://github.com/Panhamad1/smart-gym-management-system/actions/runs/41330585496)

## Code changes made

- `client/src/main.jsx` and `customer-data.js` use Firebase sessions, require a confirmed authorized customer read to open the staff area, show saved customers and ID search, display a confirmed save ID, preserve input on errors and label demo attendance. The customer directory retains the existing layout and shows fields actually stored in Firestore.
- `client/tests` and `firebase.emulator.json` exercise login, customer data and authorization in an isolated demo project. Emulator rules match the reviewed read/create policy with a synthetic UID.
- `server/src/index.js`, `server/.env.example` and `database/schema.sql` remove built-in demo authentication, require a signing secret and fail closed if MySQL is unavailable. `server/tests/auth.test.js` covers those paths with a loopback server.
- The Hosting workflow validates pull requests without deploying them. The existing live site and rules require a separate release decision.

**Checks.** Frontend production build and five data unit tests passed. Three Auth/Firestore emulator tests passed, including login/logout, wrong password, same-name records with distinct IDs, fresh-client search, invalid writes and denied access. Two legacy API loopback tests passed, including anonymous endpoints and database-unavailable login. The public customer endpoint returned HTTP 403 for a signed-out read. Approved production login and writes require an approved staff session and were not exercised during this audit.

## Jira changes made

- Created SCRUM-31 (staff access), SCRUM-32 (release verification), SCRUM-33 (design and review evidence) under their existing epics.
- Created SCRUM-34/35 for customer details, SCRUM-36/37/38 for walk-in check-in, and SCRUM-39 for the legacy API smoke check. Their work is included in parent estimates.
- Updated and moved 14 unfinished tasks from In Review to To Do, covering SCRUM-12/13, SCRUM-15–25 and SCRUM-28. Clarified Firebase persistence, real dependencies, estimates and ownership. Assigned epic owners. Jira currently offers Task, Feature, Epic and Subtask, so user requirements retain their user-story descriptions in Tasks.
- Removed overlap between plans (SCRUM-18), purchases/renewals (SCRUM-19), purchase payment (SCRUM-20), checkout payment (SCRUM-17) and the history view (SCRUM-23). SCRUM-25 records test evidence and SCRUM-32 coordinates the release decision.
- Linked release verification to access and test evidence, check-in to the Firebase model and access, and retrospective evidence to the handoff task. SCRUM-14's description and labels were briefly included in the batch update and restored. Its activity log retains both edits. Sprint 1 membership and Done status were preserved.

### Open backlog after the audit

Subtask estimates are included in the parent. The listed statuses describe review or development progress, independently of sprint selection.

| Jira issue | Scope | Type | Parent | Owner | Points | Status |
| --- | --- | --- | --- | --- | ---: | --- |
| [SCRUM-5](https://chensovanpanha.atlassian.net/browse/SCRUM-5) | Project foundation and Milestone 2 delivery | Epic | — | Yann Sokmeng | — | In Progress |
| [SCRUM-6](https://chensovanpanha.atlassian.net/browse/SCRUM-6) | Staff access and security | Epic | — | Chen Sovanpanha | — | In Progress |
| [SCRUM-7](https://chensovanpanha.atlassian.net/browse/SCRUM-7) | Customer and member records | Epic | — | Chen Sovanpanha | — | In Progress |
| [SCRUM-8](https://chensovanpanha.atlassian.net/browse/SCRUM-8) | Membership plans and subscriptions | Epic | — | Chao Vanchhoeurng | — | To Do |
| [SCRUM-9](https://chensovanpanha.atlassian.net/browse/SCRUM-9) | Manual check-in and check-out | Epic | — | Phally Sovanratana | — | To Do |
| [SCRUM-10](https://chensovanpanha.atlassian.net/browse/SCRUM-10) | Manual payment records | Epic | — | Kim Seyha | — | To Do |
| [SCRUM-11](https://chensovanpanha.atlassian.net/browse/SCRUM-11) | Basic gym dashboard | Epic | — | Mao Posovandeth | — | In Progress |
| [SCRUM-12](https://chensovanpanha.atlassian.net/browse/SCRUM-12) | Confirm MVP rules, priorities and Definition of Done | Task | SCRUM-5 | Mao Posovandeth | 2 | To Do |
| [SCRUM-13](https://chensovanpanha.atlassian.net/browse/SCRUM-13) | Design the Firestore data model and emulator seed data | Task | SCRUM-5 | Chao Vanchhoeurng | 3 | To Do |
| [SCRUM-15](https://chensovanpanha.atlassian.net/browse/SCRUM-15) | US-03: View and update customer details | Task | SCRUM-7 | Chen Sovanpanha | 3 | To Do |
| [SCRUM-16](https://chensovanpanha.atlassian.net/browse/SCRUM-16) | Record gym check-in and attendance | Task | SCRUM-9 | Phally Sovanratana | 5 | To Do |
| [SCRUM-17](https://chensovanpanha.atlassian.net/browse/SCRUM-17) | Record walk-in checkout and its linked payment | Task | SCRUM-10 | Kim Seyha | 5 | To Do |
| [SCRUM-18](https://chensovanpanha.atlassian.net/browse/SCRUM-18) | Manage monthly and yearly membership plans | Task | SCRUM-8 | Chao Vanchhoeurng | 3 | To Do |
| [SCRUM-19](https://chensovanpanha.atlassian.net/browse/SCRUM-19) | US-07: Purchase or renew a membership subscription | Task | SCRUM-8 | Chao Vanchhoeurng | 5 | To Do |
| [SCRUM-20](https://chensovanpanha.atlassian.net/browse/SCRUM-20) | US-08: Record a subscription purchase or renewal payment | Task | SCRUM-10 | Kim Seyha | 3 | To Do |
| [SCRUM-21](https://chensovanpanha.atlassian.net/browse/SCRUM-21) | US-09: Check in and out a valid subscription member without a visit fee | Task | SCRUM-9 | Phally Sovanratana | 5 | To Do |
| [SCRUM-22](https://chensovanpanha.atlassian.net/browse/SCRUM-22) | US-10: Review attendance history and open visits | Task | SCRUM-9 | Phally Sovanratana | 3 | To Do |
| [SCRUM-23](https://chensovanpanha.atlassian.net/browse/SCRUM-23) | US-11: View manual payment history | Task | SCRUM-10 | Kim Seyha | 3 | To Do |
| [SCRUM-24](https://chensovanpanha.atlassian.net/browse/SCRUM-24) | Display basic gym dashboard statistics | Task | SCRUM-11 | Chao Vanchhoeurng | 3 | To Do |
| [SCRUM-25](https://chensovanpanha.atlassian.net/browse/SCRUM-25) | Run and record end-to-end Sprint 1 acceptance tests | Task | SCRUM-5 | Kim Seyha | 3 | To Do |
| [SCRUM-28](https://chensovanpanha.atlassian.net/browse/SCRUM-28) | Record sprint review feedback and one improvement action | Task | SCRUM-5 | Yann Sokmeng | 1 | To Do |
| [SCRUM-31](https://chensovanpanha.atlassian.net/browse/SCRUM-31) | Verify Firebase staff authorization and remove legacy demo access | Task | SCRUM-6 | Chen Sovanpanha | 3 | In Review |
| [SCRUM-32](https://chensovanpanha.atlassian.net/browse/SCRUM-32) | Verify Sprint 1 Firebase release candidate against acceptance criteria | Task | SCRUM-5 | Phally Sovanratana | 2 | To Do |
| [SCRUM-33](https://chensovanpanha.atlassian.net/browse/SCRUM-33) | Complete Sprint 1 design and review evidence handoff | Task | SCRUM-5 | Yann Sokmeng | 2 | To Do |
| [SCRUM-34](https://chensovanpanha.atlassian.net/browse/SCRUM-34) | Build the customer details and validation interface | Subtask | SCRUM-15 | Chen Sovanpanha | — | To Do |
| [SCRUM-35](https://chensovanpanha.atlassian.net/browse/SCRUM-35) | Implement and verify authorized Firestore customer updates | Subtask | SCRUM-15 | Chao Vanchhoeurng | — | To Do |
| [SCRUM-36](https://chensovanpanha.atlassian.net/browse/SCRUM-36) | Model a single open walk-in visit per customer | Subtask | SCRUM-16 | Chao Vanchhoeurng | — | To Do |
| [SCRUM-37](https://chensovanpanha.atlassian.net/browse/SCRUM-37) | Connect check-in form and open visits to saved data | Subtask | SCRUM-16 | Phally Sovanratana | — | To Do |
| [SCRUM-38](https://chensovanpanha.atlassian.net/browse/SCRUM-38) | Verify walk-in entry and duplicate prevention | Subtask | SCRUM-16 | Kim Seyha | — | To Do |
| [SCRUM-39](https://chensovanpanha.atlassian.net/browse/SCRUM-39) | Verify the legacy API fails closed without staff credentials | Subtask | SCRUM-31 | Chao Vanchhoeurng | — | In Review |

## Sprint 2 recommendation

Jira shows Sprint 2 as Future with dates 2–8 November 2026, already elapsed at audit time. Agree a new one-week window and capacity with the team before committing work. Goal: **review and verify staff login and customer registration/search with reproducible Firebase evidence and a release-ready candidate**.

| Item | Owner | Points | Deliverable |
| --- | --- | ---: | --- |
| SCRUM-12 | Mao Posovandeth | 2 | Confirm acceptance scope and approval for the demo. |
| SCRUM-31 | Chen Sovanpanha | 3 | Review staff authorization and hardening. Chao Vanchhoeurng owns SCRUM-39 within these points. |
| SCRUM-25 | Kim Seyha | 3 | Record repeatable acceptance evidence and defects. |
| SCRUM-32 | Phally Sovanratana | 2 | Clean setup, verified candidate, evidence and release decision. Depends on SCRUM-31/25. |
| SCRUM-33 | Yann Sokmeng | 2 | Gather existing design, review and submission evidence. |
| **Total** | | **12** | Provisional planning estimate, subject to availability. |

Keep the Firestore visit model (SCRUM-13), customer editing (SCRUM-15), visit implementation (SCRUM-16–17), membership/payment/history/dashboard work (SCRUM-18–24) and retrospective action (SCRUM-28) in the backlog. SCRUM-16 follows the rules and data model. SCRUM-17 follows a verified check-in flow.

## Remaining work

- Teammate review and PO acceptance of the candidate. Verify the hosted flow with authorized staff only after release approval.
- Provide the Figma prototype link and genuine sprint-review/submission evidence. SCRUM-33 and SCRUM-28 track those gaps.
- Implement/edit Firestore rules only after approval. Do not use sample attendance or subscription metrics for operational reporting.
- Approve any merge to `main` explicitly because it triggers deployment. Production records, credentials, permissions and hosting were left untouched during the audit.

## Sprint 1 follow-up

The project owner confirmed that this pass covers staff login, customer registration, search and persistence. Customer editing (SCRUM-15), visits, checkout, payments, subscriptions and Sprint 2 selection are later work. The original Jira sprint goal above remains part of the historical record.

The [shared Figma file](https://www.figma.com/design/yPHukVs5VbGyT4LXg2n6Tx/smart-gym-managements--Copy-?node-id=1-2) contains seven screen designs. The original audit found no prototype connections. The Sprint 1 follow-up added five verified connections across Staff Login, Dashboard and Customers. Login opens Dashboard, Customers and Dashboard link in both directions, and Log out on either screen opens Staff Login. SCRUM-33 tracks this evidence and the pending review, retrospective and Moodle records.

Use the [manual test checklist](manual-test-checklist.md) to verify both the app and the prototype. The Firebase tests use the local demo project and synthetic records.

# SCRUM-28 — Sprint review / retrospective notes

**Status: draft, not a record of a completed meeting.** Review and retrospective date, attendees, actual feedback and Product Owner approval are **not yet provided**.

## Review agenda for Scrum Master Yann
- Demonstrate Sprint 3 membership plans, price changes and historical payment snapshots.
- Demonstrate same-name identity verification, paid walk-in and member-covered entry/checkout.
- Demonstrate renewals, Cambodia-exclusive expiry, receipts and dashboard reports.
- Inspect GitHub PRs linked to each Jira task and share latest CI results.
- Compare actual Done issues against Sprint Goal after the live demonstration; never use story points as proof of completion.

## Engineering observations (not quotes from a meeting)
- Earlier customer selections exposed long IDs, which were easy to confuse for same-name customers.
- Firestore Auth login alone does not grant database access; staff allowlist and security-rule changes need separate review.
- Some Sprint 3 work was not originally linked to GitHub and non-code evidence was missing.
- Automated unit tests are useful, but UI and production permission verification remain separate checks.

## Proposed single process improvement
Every Jira Story/Task must include a GitHub branch/commit/PR containing the SCRUM key, an acceptance test checklist and documented review evidence. **Suggested owner: Yann Sokmeng; acceptance/approval pending.**

## Fill in after the actual review
Meeting date/time: PENDING
Attendees: PENDING
Feedback actually received: PENDING
Demo passed/failed cases: PENDING
Improvement agreed / owner: PENDING
Linked evidence / follow-up issues: PENDING

Do not close this Jira task until those facts exist.
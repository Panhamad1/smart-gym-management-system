# SCRUM-32 — Sprint 1 Firebase release candidate evidence

Evidence already recorded in Jira SCRUM-32: PR #7 was merged, GitHub Actions deployed a Firebase login/customer candidate, and a signed-out production Firestore read was denied (HTTP 403). Those are historical Jira-reported results, not a newly performed live check here.

Repository main as inspected on 28 Nov 2026: commit 1368e31fb92a6684535bca5fd24838acb881c610, merged Sprint 2 reporting on 12 Nov 2026. This is older than Sprint 3 PRs #13–#16, which remain draft/unmerged.

## Verification required for final acceptance
- Open deployed /version.json and confirm the exact live commit SHA.
- Sign in as a real authorized staff test account, verify customer search, counts, check-in and sign-out.
- Verify an unapproved account cannot read customers; do not use real customer records.
- Record screenshots, expected/actual results, dates and tester for every case.
- Add links to acceptance results in SCRUM-25 and verify teammate approval.

Current status: historical release evidence documented, but signed-in live acceptance is pending. Do not mark Done solely from CI.
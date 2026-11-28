# SCRUM-13 — Firestore document model and emulator fixtures

All collections belong to Firebase project smart-gym-team2 in production, and to the isolated project **demo-smart-gym** for tests. Live Firestore rules are managed separately and are NOT copied from this repository's synthetic emulator rules.

| Collection | Document key | Essential fields | Meaning |
|---|---|---|---|
| customers | random Firestore ID | name, phone?, email?, createdAt, archivedAt? | Unique customer identity, regardless of duplicate names/phones |
| membershipPlans | random Firestore ID | label, months, amountMinor, currency='USD', active, createdAt, createdBy | Staff-managed monthly/yearly plan. Previous payments snapshot pricing |
| customerMemberships | customer ID | coveredFromDay, paidThroughExclusive, coveredFromAt, paidThroughAt, latestSubscriptionId, updatedAt, updatedBy | One current aggregated entitlement per customer, including renewals |
| subscriptions | purchase operation ID | customerId, planId, planName, months, amountMinor, startDay, endDayExclusive, purpose, recordedAt, recordedBy | Immutable history of purchases and renewals |
| subscriptionPayments | same ID as related subscription | subscriptionId, customerId, planId, purpose, amountMinor, currency, method, status, receivedAt, recordedBy | Exactly one linked, immutable payment per purchase |
| openWalkIns | customer ID | customerId, customerName, visitId, checkedInAt, checkedInBy | One currently open paid walk-in |
| walkInReceipts | visit ID | customerId, visitId, checkedInAt/Out, amountMinor=200, method, status='paid' | Completed paid walk-in and receipt |
| openMemberVisits | customer ID | customerId, customerName, visitId, subscriptionId, checkedInAt, checkedInBy | One currently open member visit without a fee |
| memberVisitHistory | visit ID | customerId, visitId, checkedInAt/Out, amountMinor=0, visitType='subscription' | Completed member-covered attendance (no second payment) |

## Identity, currencies and time
Firestore document IDs are authoritative. Staff-visible GYM- short references are display hints only (collision-aware within current list). Contacts can repeat across people. Prices are integer **cents** with currency USD, not floats. Firestore server timestamps track transactions/visits/payments; calendar dates are strings YYYY-MM-DD in Cambodia time, with **exclusive** end. Entitlement stores the corresponding UTC timestamps for secure server-side check-in validation.

## Transaction boundaries and duplicate prevention
- Staff membership purchase/renewal: read customer, active plan, current customerMemberships and operation ID; create subscriptions/id + subscriptionPayments/id together, and update the customerMemberships document in the **same** Firestore transaction. Reusing a purchase operation ID is idempotent.
- Member check-in: read customer, paid entitlement, openWalkIns/customer and openMemberVisits/customer; verify coverage, then create openMemberVisits/customer atomically. Paid walk-in checks the other open-visit collection before opening.
- Member checkout: create memberVisitHistory/visitId and delete openMemberVisits/customer in the **same** transaction. This does not create a payment. Paid walk-in creates an exactly-$2 receipt while closing the visit.
- Archive: deny when either visit type remains open.

## Authentication and authorization
Firebase Auth establishes sign-in. Firestore rules must independently restrict read/write to the *approved staff UID allowlist*. Client-only checks are not a security boundary. Production access is NOT granted by adding an Auth user alone. Every write path needs rule review, and all synthetic emulator rules use a fake staff UID that must NEVER be published to production.

## Local emulator seed
From client directory, run:

    npm ci
    npx firebase-tools@14 emulators:exec --project demo-smart-gym --config firebase.emulator.json --only auth,firestore "npm run seed:memberships:emulator"

The script hard-requires FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and uses **synthetic** same-name customers, example plans, a purchase, both visit types, and matching receipts. Run on a fresh emulator; repeated seeds create extra test customers/plans. No real production data is read or written.

## Indexes
Current dashboard/history listeners load small demo collections without multi-field query filters, then filter in the client. Individual walk-in histories query the same timestamp field with orderBy + range filters, which uses a normal single-field index. If the demo grows, move filtering/counts to paginated queries and deploy reviewed composite indexes. Never store an unlimited production customer directory in the browser.

## Review needed
A teammate must inspect transaction relationships, verify emulator seed output and Firestore rules. Published production rules must be exported and compared before any integration release.
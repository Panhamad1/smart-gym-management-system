# SCRUM-12 — MVP decisions, proposed policy and Definition of Done

Status: **PROPOSED for Product Owner/team approval**, not a record of a meeting or official sign-off. Written for Sprint 3 on 28 November 2026.

## MVP scope
Staff login via Firebase Auth; individual customer records with immutable IDs; manual walk-in check-in/check-out ($2 demo fee); monthly/yearly subscriptions ($50/$500 example prices); cash or bank transfer confirmation; linked payment and attendance history; basic dashboard. No QR scan, card printing, online card payments, mobile application or AI trainer.

## Proposed decisions to confirm with Mao (Product Owner)
- Customer name is required. Phone is **recommended**, not unique or required for short walk-ins; family members may share one. Staff verify identity using customer reference plus last four phone digits or other details. A duplicate name is not a duplicate account.
- Walk-in fee: **$2 USD** collected and manually confirmed during checkout.
- Example plans: monthly **$50** for one calendar month, yearly **$500** for 12 calendar months. Staff can change plan prices; saved payment amounts must never be rewritten.
- Coverage is calculated in the **Asia/Phnom_Penh** time zone. Start day is included, end day is **excluded** (membership expires at 00:00 on end day). January 31 plus one month becomes February 28 or 29.
- Active renewals extend from the current paid-through end, without overlapping or double-charging for days already covered. Lapsed members start a new period today.
- A valid subscription check-in and checkout do not charge an additional walk-in fee. Missing, future, inactive or expired subscription is not valid for covered entry; staff may choose a paid walk-in instead.
- Only one open gym visit of either type per customer. Duplicate check-ins/checkouts are rejected by transactions and security rules.
- Only actually received cash/bank payments are recorded; the UI requires explicit staff confirmation and transaction creates a linked payment and subscription together.
- Archived customers cannot check in or be edited. Historical payments/visits are kept.

## Proposed Sprint 3 goal
Deliver an approved, tested Firebase-backed membership lifecycle (plans, sales and renewals, manual payments, member check-in/out, and unified dashboard/history), while finishing secure customer editing and Sprint 1 verification.

## Definition of Done
1. Acceptance criteria demonstrated with specific evidence.
2. Relevant unit, Firebase emulator and end-to-end/manual tests pass, including unauthorized access and same-name customers.
3. A second human developer reviews the change; GitHub PR and commits reference the matching SCRUM key.
4. UI, Firestore writes, indexes, rules and error states are integrated. Production changes only after review of the *real* staff allowlist.
5. No secrets or real customer records in test evidence. Documentation updated.
6. Product Owner signs off actual behavior. Non-code tasks retain links to genuine notes, test artifacts or decisions.

## Team
Mao Posovandeth — PO; Yann Sokmeng — SM; Chen Sovanpanha, Chao Vanchhoeurng, Phally Sovanratana, Kim Seyha — developers. These are existing project role assignments, not evidence of a new meeting.

**Pending:** PO confirms prices, expiry policy, dates, Sprint Goal, capacity and ownership. Do not close SCRUM-12 until those decisions are actually recorded.
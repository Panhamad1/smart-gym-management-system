# SCRUM-3 — Customer registration and search

## Feature
- Register a walk-in customer with a required name and optional phone/email.
- Each registration creates its own MySQL auto-increment customer ID, including when names match.
- Search by exact customer ID or partial name (up to 100 results, newest first).
- Form values remain in place if validation or a request fails.
- Customers persist across page refreshes because data is stored in MySQL.

## Setup
Use the parent branch's README to install and start MySQL, Express and React. Import `database/schema.sql` if you have not already.

## Manual acceptance tests
1. Open http://localhost:5173. Register `Sample Alice` with no contact fields. Confirm success displays a numeric ID.
2. Refresh the page. Confirm `Sample Alice` remains in the customer list.
3. Search `Sample`; confirm it appears. Search the numeric ID; confirm that record appears.
4. Search `NothingMatches999`; confirm the empty-state message.
5. Submit whitespace-only name; confirm the form/API rejects it.
6. Register another `Sample Alice`; confirm it receives a *different* ID.
7. Try invalid email; confirm error feedback without losing the other entered fields.
8. Temporarily stop MySQL, attempt a search and confirm a safe error; restart MySQL.

## API
- `GET /api/customers?search=Alice` -> `{ "customers": [...] }`
- `GET /api/customers?search=123` -> matching customer ID
- `POST /api/customers` with `{ "fullName": "Sample Alice", "phone": "", "email": "" }` -> HTTP 201 and `{ "customer": { "id": 1, ... } }`
- Invalid inputs -> HTTP 400 with `{ "error": "..." }`

## Notes
Use fictitious test customers, not real personal information. Authentication and role-based protection are tracked separately in SCRUM-14; do not expose this demo API publicly until that dependency is implemented.

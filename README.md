# Smart Gym Management System

React + Vite frontend, Express API and MySQL database foundation for Jira **SCRUM-2**.

## Requirements
- Node.js 20.19+ (or 22.12+)
- MySQL 8+
- npm

## Setup
1. Clone this repository and open its folder.
2. Initialize MySQL: `mysql -u root -p < database/schema.sql` (or import the SQL file in MySQL Workbench).
3. In `server/`, copy `.env.example` to `.env` and set your MySQL credentials.
4. Run `cd server && npm install && npm run dev`.
5. In a second terminal, run `cd client && npm install && npm run dev`.
6. Open http://localhost:5173 and check the API/MySQL status.

## API
- `GET http://localhost:3001/api/health` responds with `{ "status": "ok", "database": "connected" }` when MySQL is available, or HTTP 503 when unavailable.

## Security and notes
- Never commit real `.env` files or database passwords.
- Errors exposed by the API are generic; details are logged server-side.
- This is the project foundation only. Customer CRUD will be implemented under SCRUM-3 and SCRUM-15.

## Verification checklist (SCRUM-4)
- [ ] Fresh clone installs dependencies in both client and server
- [ ] MySQL schema imports successfully
- [ ] Backend health endpoint reports connected
- [ ] React page displays backend status
- [ ] Missing database connection produces a safe 503 response
- [ ] No real secrets committed

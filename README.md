# Voting Application for US Elections

A demo web application for running local US elections: citizens request a voter account, election administrators verify and approve them, set up precincts, races and elections, and approved voters cast one ballot per race in their own precinct while the election is open.

It started as our Fundamentals of Software Engineering project (Vedansh, Alec and Joseph).

## Features

### Voters
- **Request an account** with name, age, address, zip code, ID number and email. Applicants must be at least 18.
- **Voter ID by email.** When an administrator approves the request, the voter is emailed a voter ID and a one-time link to create a password.
- **Dashboard** listing every election with its status (`upcoming`, `active`, `ended`, `closed`) and whether the voter can vote in it.
- **Eligibility checks** run on the server: the race must belong to the voter's precinct (zip code), the election must be open, and the voter must not have voted in that race yet.
- **One vote per race.** Votes are recorded in a database transaction, so a voter cannot vote twice, even by sending two requests at once.
- **Voting history** showing the race, candidate, party and time of each vote.
- **Change details** (address, city, zip code), which updates which races the voter can vote in.
- **Forgot password** emails a reset link. The response is the same whether or not the account exists.

### Administrators and managers
- Approve or deny pending voter requests.
- Search voters by name, zip code or email.
- Create precincts, races (with any number of candidates) and elections (start and end date and time).
- Close an election early.
- View live results with vote counts and percentages for each race.

### Security
- Every SQL query uses parameters (no SQL injection).
- Passwords are hashed with salted `scrypt`. Old plain-text passwords still work and are upgraded to a hash on the next login.
- Password create/reset links use random one-time tokens. Only a hash of the token is stored, and links expire after 24 hours by default.
- The server checks the user's role on every page and socket event. Voters cannot reach admin pages or actions, and admin data is only sent to admins.
- User-supplied text is always rendered as text, never as HTML, which prevents cross-site scripting (XSS).
- Credentials and secrets are read from environment variables instead of being stored in the code.

## Tech stack

| Layer    | Technology                                                       |
|----------|------------------------------------------------------------------|
| Database | MySQL 8 / MariaDB 10.5+                                          |
| Backend  | Node.js 20+, Express, Socket.IO, express-session, mysql2         |
| Frontend | HTML, CSS, vanilla JavaScript                                    |
| Email    | Nodemailer (SMTP)                                                |
| Testing  | Jasmine                                                          |

## Project structure

```
server.js              Express app: page routes and Socket.IO event handlers
src/
  config.js            Settings read from environment variables
  db.js                MySQL connection pool and transaction helper
  security.js          Password hashing, one-time tokens, voter ID generation
  validation.js        Input validation for every form
  elections.js         Election status and voting-history helpers
  mailer.js            Email sending (prints to the console when SMTP is not set up)
views/                 HTML pages (home, login, request, voter, admin, ...)
public/static/         Front-end scripts and the shared stylesheet
database/
  schema.sql           Creates the `votinginfo` database and tables
  seed.sql             Demo data (accounts, precincts, races, elections)
spec/                  Jasmine unit tests
```

## Getting started

### 1. Prerequisites
- Node.js 20 or newer
- MySQL 8+ or MariaDB 10.5+

### 2. Install dependencies
```bash
npm install
```

### 3. Create the database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p votinginfo < database/seed.sql   # optional demo data
```

### 4. Configure
All settings are environment variables. `.env.example` lists them with their defaults. The most important ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `BASE_URL` | `http://localhost:3000` | Public URL used in emailed links |
| `SESSION_SECRET` | `change-me-in-production` | Secret used to sign session cookies |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `3306` / `root` / *(empty)* / `votinginfo` | Database connection |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | *(empty)* | Outgoing email. If `SMTP_HOST` is empty, emails are printed to the server console instead. |

Example:
```bash
export DB_USER=vote DB_PASSWORD=secret SESSION_SECRET=$(openssl rand -hex 32)
```

### 5. Run
```bash
npm start
```
Open http://localhost:3000.

### Demo accounts (from `seed.sql`)
All demo accounts use the password `Password@123`.

| Voter ID   | Role    | Zip code |
|------------|---------|----------|
| `voterid4` | admin   | 52240    |
| `voterid5` | manager | 52240    |
| `voterid1` | voter   | 52240    |
| `voterid2` | voter   | 52242    |
| `voterid3` | voter   | 52240    |

The seed data also includes two pending voter requests and two active elections.

## Typical workflow
1. A citizen opens **Request an account** and submits their details.
2. An admin logs in, reviews **Pending voter requests** and clicks **Approve**.
3. The voter receives an email with their voter ID and a **Create password** link. Without SMTP, copy the link from the server console.
4. The admin creates a **precinct**, a **race** for that precinct's zip code, and an **election** for the race.
5. While the election is active, the voter logs in, clicks **Vote** and submits a ballot.
6. The admin follows the results in the **Results** section and can **Close** the election.

## Testing
```bash
npm test
```
Unit tests cover validation, password hashing, tokens, election status and voting-history logic. GitHub Actions runs them on every push and pull request.

## Socket events
The browser talks to the server over Socket.IO. Main events:

| Event (client → server) | Who | Purpose |
|---|---|---|
| `login`, `request`, `ForgotPassword`, `createPassword` | anyone | Authentication and registration |
| `requestVoterDashboard`, `validateVoterWithRace`, `castVote`, `changeDetails` | voter | Voting |
| `requestAdminDashboard`, `approveVoter`, `denyVoter`, `searchVoter`, `NewPrecinct`, `NewRace`, `NewElection`, `closeElection`, `requestResults` | admin, manager | Administration |

## Disclaimer
This is an educational demo. It is not certified election software and must not be used for real elections.

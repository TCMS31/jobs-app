# Jobs Board

A two-package job board: an Express + Prisma API over PostgreSQL, and a React client that
lists open roles and lets a signed-in user apply with one click. Applying is idempotent —
the button flips to "Applied", and a second click (or a second racing request) changes
nothing, because the database will not accept a duplicate. It is deliberately narrow: no
employer side, no job creation, no profile page.

![Job listings, signed in](docs/screenshots/01-job-listings.png)

| After applying | Sign in, rejected credentials | A single listing |
| --- | --- | --- |
| ![Applied state](docs/screenshots/02-applied-state.png) | ![Sign in](docs/screenshots/03-sign-in.png) | ![Job card](docs/screenshots/04-job-card-applied.png) |

| Phone, listings | Phone, sign in |
| --- | --- |
| ![Listings at 390px](docs/screenshots/05-mobile-listings.png) | ![Sign in at 390px](docs/screenshots/06-mobile-sign-in.png) |

All six were captured by [`docs/e2e-walkthrough.js`](docs/e2e-walkthrough.js) driving the
real app with Playwright, at 1440x900 and 390x844, against a seeded database. Its output is
in [`docs/e2e-walkthrough.txt`](docs/e2e-walkthrough.txt).

The look is a noticeboard rather than a dashboard: warm paper, near-black ink, one pine-green
accent reserved for the only action the app offers, Source Serif 4 for headings and Public
Sans for text. Listings are a single readable column of `<article>` elements, each named by
its title; an applied role gets a rule down its left edge.

## About the demo data

The roles above are **invented placeholder content**, not real postings. They are a
hand-written array in
[`jobs-server/src/constants/jobs.ts`](jobs-server/src/constants/jobs.ts), loaded by
`prisma db seed`: 12 listings, 6 users, 21 applications between them. The `Job` model is
correspondingly thin — title, description, experience level, employment type, timestamps.
No company, location, salary or closing date, so this is not a model of a real job posting
and should not be read as one. It exists to give the listing, the paging and the applied
state something to render.

## The data model

Three tables. The interesting one is `Application`, which is a join table and not an array.

```mermaid
erDiagram
    User ||--o{ Application : submits
    Job ||--o{ Application : receives

    User {
        string id PK "uuid"
        string email UK
        string name
        string password "bcrypt hash, never serialised"
        datetime createdAt
    }
    Job {
        string id PK "uuid"
        string title
        string description
        string experienceLevel
        string employmentType
        datetime createdAt "indexed with id, drives the keyset cursor"
        datetime updatedAt
    }
    Application {
        string id PK "uuid"
        string userId FK "unique together with jobId"
        string jobId FK "indexed for the applicant-count aggregate"
        datetime createdAt
    }
```

Two constraints in [`prisma/schema.prisma`](jobs-server/prisma/schema.prisma) carry most
of the weight. `@@unique([userId, jobId])` on `Application` makes a duplicate impossible at
the database level, so idempotency is not something the application code has to get right
under concurrency — it only has to decide what to do with the rejection. `@@index([createdAt, id])`
on `Job` means the newest-first listing serves both its ordering and its cursor seek from
one index.

The listing endpoint returns `hasApplied` for the caller and an `applicantCount`, and no
applicant identifiers at all — pinned by the cross-user test
`never discloses which users applied to a job`.

## One click, one application

The applicant is taken from the verified token, never from the request body, and the unique
constraint decides the outcome when two requests race.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Card as Job card
    participant Axios as baseService
    participant API as POST /api/jobs/apply
    participant DB as PostgreSQL

    User->>Card: click "Apply to job"
    Card->>Axios: applyToJob(jobId)
    Axios->>Axios: request interceptor reads the cookie now, not at import
    Axios->>API: POST with jobId and the authtoken header
    API->>API: verify JWT, take userId from the token
    Note over API: a userId in the request body is ignored
    API->>DB: SELECT job by id
    alt job does not exist
        DB-->>API: no row
        API-->>Axios: 404 Job not found
        Axios-->>Card: reject
        Card-->>User: inline error, button stays "Apply to job"
    else job exists
        API->>DB: INSERT INTO Application
        alt unique userId+jobId violated
            DB-->>API: Prisma P2002
            API->>API: already applied, so report success
        else first application
            DB-->>API: row created
        end
        API-->>Axios: 200
        Axios-->>Card: resolve
        Card-->>User: button becomes "Applied" and disables
    end
```

Three tests in `tests/jobs.test.ts` cover the branches: `is idempotent: applying twice
leaves exactly one application`, `survives concurrent applications from the same user
without duplicating` (five simultaneous requests, all expected to return 200) and
`attributes the application to the token holder, ignoring a userId in the body`.

## Running it

### With Docker Compose (one command path)

Needs Docker with Compose v2. Nothing else: Postgres, migrations, the API and the built
client all run in containers.

```bash
cp .env.example .env
# set JWT_KEY in .env, e.g. to the output of: openssl rand -hex 32
docker compose up -d --build --wait               # db, one-shot migrate, api :8080, web :3000
docker compose --profile seed run --rm seed       # 6 users, 12 roles, 21 applications
```

Open http://localhost:3000 and sign in with a seeded demo account:
`johndoe@example.com` / `abcd1234`. `docker compose down -v` removes everything, including
the database volume.

The API image is multi-stage on `node:22-alpine`, runs as the unprivileged `node` user and
has a healthcheck on `/api/health`; Compose adds `init: true` so the graceful shutdown in
`server.ts` gets its signals. The web image builds the bundle and serves it from nginx on
port 8080 as a non-root user, with an SPA `try_files` fallback. `migrate` is a one-shot
service the API waits on.

### Without Docker

Needs Node 22 (`.nvmrc`), yarn 1 and a PostgreSQL 14+ you can write to.

```bash
cd jobs-server
cp .env.example .env            # set JWT_KEY and point DATABASE_URL at your database
yarn install && yarn migrate
yarn seed
yarn dev                        # http://localhost:8080

cd ../jobs-web                  # second terminal
cp .env.example .env
yarn install && yarn start      # http://localhost:3000
```

`JWT_KEY` has no default and no fallback: `src/config/env.ts` reads it at import and throws
if it is missing, so a misconfigured process fails at boot rather than issuing tokens it
cannot verify.

## The API, by example

Every response uses one envelope: `{ "payload": … }` on success, `{ "payload": {},
"message": "…" }` on failure. Protected routes take the token in an `authtoken` header or
as `Authorization: Bearer …`. Captured against the Compose stack above (token shortened):

```bash
$ curl -s localhost:8080/api/health
{"status":"ok"}

$ curl -s -X POST localhost:8080/api/auth/signup -H 'Content-Type: application/json' \
    -d '{"name":"Rosa Mendes","email":"rosa@example.com","password":"correct-horse"}'
{"payload":{}}                                                    # 200
# the same request again
{"payload":{},"message":"User already exists"}                    # 409

$ curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"johndoe@example.com","password":"abcd1234"}'
{"payload":{"authtoken":"eyJhbG…42bI","userId":"54d282d2-e35e-4efa-a212-33f65e8b8f29","name":"John Doe"}}
```

```bash
$ curl -s 'localhost:8080/api/jobs?limit=2' -H "authtoken: $TOKEN"
```

```json
{
  "payload": {
    "jobs": [
      {
        "id": "e3ab44bc-ad2a-41ab-a31c-7008f09c4ccc",
        "title": "Engineering Manager",
        "description": "Lead a team of six working on the core marketplace. …",
        "experienceLevel": "Lead",
        "employmentType": "Full-Time",
        "createdAt": "2026-11-07T10:29:09.133Z",
        "applicantCount": 3,
        "hasApplied": true
      },
      {
        "id": "d8897dd8-8182-4f60-8e16-47523e9b5552",
        "title": "Security Engineer",
        "description": "Run the application security programme: …",
        "experienceLevel": "Senior",
        "employmentType": "Full-Time",
        "createdAt": "2026-11-06T10:29:09.133Z",
        "applicantCount": 4,
        "hasApplied": false
      }
    ],
    "nextCursor": "d8897dd8-8182-4f60-8e16-47523e9b5552"
  }
}
```

Pass `nextCursor` back as `?cursor=` for the next page; `?title=engineer` filters
case-insensitively. Applying, twice in a row, and then to a job that does not exist:

```bash
$ curl -s -X POST localhost:8080/api/jobs/apply -H "authtoken: $TOKEN" \
    -H 'Content-Type: application/json' -d '{"jobId":"d8897dd8-8182-4f60-8e16-47523e9b5552"}'
{"payload":{"jobId":"d8897dd8-8182-4f60-8e16-47523e9b5552","hasApplied":true}}   # 200
{"payload":{"jobId":"d8897dd8-8182-4f60-8e16-47523e9b5552","hasApplied":true}}   # 200 again
{"payload":{},"message":"Job not found"}                                         # 404
```

Without a token, or with a token whose account has since been deleted, the answer is
`{"payload":{},"message":"Unauthorized user"}` with a 401, and the client returns to sign-in.

## Environment

### `jobs-server/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `JWT_KEY` | **yes** | none | Secret used to sign and verify JWTs (HS256). Throws on boot if unset. |
| `DATABASE_URL` | **yes** | none | Postgres connection string for Prisma. |
| `PORT` | no | `8080` | Port the API listens on. |
| `REACT_APP_URL` | no | `http://localhost:3000` | Origin allowed by CORS. |
| `DEFAULT_PAGE_SIZE` | no | `20` | Jobs returned when the client does not ask for a size. |
| `MAX_PAGE_SIZE` | no | `100` | Ceiling applied to a client-supplied `limit`. |
| `TEST_DATABASE_URL` | no | none | When set, `yarn test` uses this database instead of `DATABASE_URL`. |

### `jobs-web/.env`

`REACT_APP_API_URL` (**required** — base URL of the API including `/api`, inlined into the
bundle at build time) and `PORT` (optional, defaults to `3000`).

### Root `.env` — Docker Compose only

`JWT_KEY` (required, Compose refuses to interpolate without it), `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`, `API_PORT`, `WEB_PORT`, `PUBLIC_API_URL`, `WEB_ORIGIN`.
Defaults and comments are in [`.env.example`](.env.example).

## Day-to-day commands

| | `jobs-server` | `jobs-web` |
| --- | --- | --- |
| run | `yarn dev` | `yarn start` |
| tests | `yarn test` (mocha, needs a database) | `yarn test` / `yarn test:ci` |
| lint | `yarn lint` | `yarn lint` |
| format | `yarn format` / `yarn format:check` | `yarn format` / `yarn format:check` |
| types | `yarn typecheck` | `yarn typecheck` |
| build | `yarn build` → `dist/` | `yarn build` |
| other | `yarn migrate`, `yarn seed`, `yarn benchmark` | `yarn coverage` |

**67 tests**: 33 on the API (mocha, chai, supertest) and 34 on the client (Jest and React
Testing Library). Last run: `33 passing (3s)` and `Test Suites: 5 passed / Tests: 34 passed`.

The API tests are integration tests and write real rows. Set `TEST_DATABASE_URL` to a
throwaway database so a run cannot leave fixtures in your development data; the suites
create everything they need and do not assume the seed has run.

## What the listing endpoint costs

`GET /api/jobs` is the hot path. `jobs-server/scripts/benchmarkListing.ts` (`yarn
benchmark`) builds a copy of the *previous* table shape — a `TEXT[]` of applicant ids on
each job row, returned in full with no paging — next to the current one, so the comparison
is measured rather than estimated. Committed output, in
[`docs/listing-benchmark.txt`](docs/listing-benchmark.txt):

```
Dataset                                             500 jobs, 200 users, 25000 applications
Runs per measurement (median reported)              15
BEFORE  listing query, all rows + applicant arrays  28.1 ms
BEFORE  JSON response size                          1151.8 KiB
BEFORE  applicant ids disclosed to the caller       25000
AFTER   GET /api/jobs over HTTP, one page of 20     2.2 ms
AFTER   HTTP response size                          7.7 KiB
AFTER   applicant ids disclosed to the caller       0
```

Re-running it elsewhere reproduced the payload sizes and disclosure counts exactly
(1151.8 KiB → 7.7 KiB, 25000 ids → 0) and gave 32.5 ms → 2.6 ms for the timings. Treat the
millisecond figures as hardware-dependent and the ratio as the point: roughly 150x less
data on the wire. The gap widens with applicant count, because the old payload grew with it
and the new one does not.

Three things produce the "after" number:

- **`select` instead of everything** — the six fields the card actually renders.
- **A cursor instead of an offset.** `skip` makes Postgres walk and discard every preceding
  row, so page 500 costs five hundred pages of work. Seeking on the indexed
  `(createdAt, id)` pair costs the same for page 500 as for page 1.
- **Three queries, not 1 + N.** A page of 20 needs the jobs, their applicant counts, and
  which of them this caller applied to: one `findMany`, one `groupBy`, one scoped
  `findMany`. That count does not change with page size.

No cache and no queue: at this size they would be decoration, and both would need
invalidating on every application.

## Decisions worth explaining

**Layering, one direction.** `routes → middlewares → controllers → services → lib/prisma`.
Routes bind HTTP. Controllers validate with yup and shape the response envelope, and make
no Prisma calls. Services hold the rules, are the only layer that touches the database, and
raise typed failures from `errors/httpError.ts` (`ConflictError`, `NotFoundError`,
`UnauthorizedError`) which `helpers/exceptionHelper.ts` maps to status codes — an
unexpected 500 is logged in full and answered generically, while 4xx keep their message.
`src/lib/prisma.ts` exports the single client every service imports, so the process holds
one connection pool.

**Uniqueness is the database's job, twice.** Sign-up does not look the email up first: it
inserts, and the unique index turns a second, simultaneous sign-up into a 409 rather than a
500. Applying works the same way on `(userId, jobId)`. Password hashing uses bcrypt's async
API so a sign-in does not hold the event loop for the ~60 ms a hash costs.

**The session has exactly one home.** `jobs-web/src/services/authStorage.ts` is the source
of truth and `isAuthenticated` is derived from the stored token, so the two cannot
disagree. A 401 from any request clears the session through the axios response interceptor
and hands control to `setUnauthorizedHandler`, which returns the user to sign-in.

**The token is read per request**, inside a `baseService` request interceptor rather than
baked into the instance defaults. `src/services/__tests__/baseService.test.ts` imports the
module before any sign-in and then asserts the header appears, including
`picks up a token that changed since the previous request`.

**Sign-in establishes a session before it navigates.** If the response carries no token the
form shows an error and stays put — `does NOT navigate when the response carries no token`.

**The extension seam is `jobService.listJobs`.** It takes one options object (`userId`,
`title`, `cursor`, `limit`) and returns a `JobPage`. Adding a filter — employment type,
experience level, posted-after — is one field on `ListJobsOptions`, one clause in
`buildWhere` and one line in `listJobsSchema`, with no change to the controller, the route
or the client's service call.

## Where things live

```
jobs-server/
  prisma/      schema.prisma · migrations (incl. the backfill off the old array) · seed.ts
  scripts/     benchmarkListing.ts
  src/
    config/    env.ts — validated at import, throws when JWT_KEY is absent
    lib/       prisma.ts — the one client
    routes/    HTTP binding only: /api/health, /api/auth, /api/jobs
    services/  jobService, userService — the only layer that touches Prisma
    app.ts     builds the Express app and does not listen
    server.ts  binds the port, graceful shutdown on SIGINT/SIGTERM
               (plus middlewares/, controllers/, errors/, helpers/, validationSchemas/)
  tests/       auth.test.ts · jobs.test.ts · root.test.ts · helpers.ts · setup.ts

jobs-web/src/
  pages/       Signin · Signup · Jobs, each with __tests__
  components/  Header · Job · TextInput · Forms · FormContainer · AppRoutes
  contexts/    AuthContext — session state derived from authStorage
  services/    authStorage · baseService · authService · jobService (+ __tests__)
  schemas/     yup validation mirroring the API rules
  theme.ts     one MUI theme · __mocks__/axios.js so no test can hit the network

docs/          screenshots · e2e-walkthrough.{js,txt} · listing-benchmark.txt
```

## Out of scope

- **No employer side.** Roles come from the seed script or directly from the database.
  There is no endpoint or UI to post, edit or close one.
- **No way to withdraw an application.** Applying is one-way.
- **Title search is API-only.** `GET /api/jobs?title=…` works and is tested; the client has
  no search box.
- **`contains` search is a sequential scan.** Fine at this size; beyond it, it wants a
  trigram index or a full-text column, which this dataset does not justify.
- **Tokens cannot be revoked.** JWTs are stateless and valid for seven days. Signing out
  clears the client's cookies; the token itself stays valid until it expires.
- **Session cookies are not `httpOnly`,** because the client reads them. A successful XSS
  could therefore read the token. The right fix is an `httpOnly` cookie set by the API plus
  a CSRF strategy — a change to the auth design, not made here.
- **No rate limiting** on sign-in or sign-up. Unknown-email and wrong-password take the
  same path and return the same message, but brute force is unthrottled.
- **The client is still on Create React App.** `react-scripts` 5 pins TypeScript 4.9 and
  carries known advisories in its build tooling (they do not ship in the bundle). Moving to
  Vite is the next step for the client and was not part of this pass.
- **Applicant counts are aggregated per request,** not cached. **The API tests need a real
  PostgreSQL** — they are integration tests by design.

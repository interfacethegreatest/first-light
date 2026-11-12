# MongoDB access layer and same-origin Node API

This implementation keeps React, TypeScript, Vite, the existing scenes and anonymous browser workspace. Node.js 24 runs root `api/*.ts` functions on a backend-capable host. There is no Next.js or Express production runtime. GitHub Pages remains the existing live site until a separately approved Vercel Preview and production cutover have been verified.

## Inventory: Calendar4 to First Light

Calendar4 was audited at `7b7e533e587d4991c97b63259355d1a5e9141616` (all 23 API files and relevant consumers/lockfile). Its current connection, User schema and NextAuth route were checked again before implementation. Source references:

- [Mongoose connection](https://github.com/interfacethegreatest/Calendar4/blob/main/src/utils/connectDB.ts): reuse the cached promise idea; omit swallowed errors, deprecated options and logging the connection.
- [User](https://github.com/interfacethegreatest/Calendar4/blob/main/src/models/User.ts): reuse connection-local model registration; omit calendar/profile/password/social business fields.
- [NextAuth](https://github.com/interfacethegreatest/Calendar4/blob/main/src/pages/api/auth/%5B...nextauth%5D.ts): Google/GitHub/Discord and native Mongo adapter with JWT session strategy. Calendar4 does not declare the User/Session storage pair now present in First Light. Do not copy its extra Mongo pool or its client-asserted identity routes.

| Category | Files/work | Decision |
| --- | --- | --- |
| **Keep** | `src/server/lib/{config,db,session-config}.ts`; `models/{User,Session}.ts`; `auth/{oauth-user,sessions}.ts`; both admin scripts | Retain the already adapted typed, bounded/retryable connection, minimal federated identities and hashed opaque sessions. |
| **Adapt** | `api/{health,ready,not-found}.ts`; `api/auth/*`; `auth/session-http.ts`; `http/response.ts`; callback example | Native Node request/response handlers, same cookie semantics, no production listener or Express. |
| **Add** | `models/ResearchWorkspace.ts`, `research/*`, `http/json.ts`, `api/research/*` | Owned research, validation, explicit import and revision concurrency protection. |
| **Add** | `src/client/*`, account component/hook, minimal App wiring | Same-origin calls, memory-only account data, explicit local/file import, logout and account-boundary cleanup. |
| **Add** | `vercel.json`, Vite dev proxy, validation workflow, tests and this guide | Serverless routing and verification. Keep Pages workflow unchanged. |
| **Remove after verification** | `auth/session-routes.ts`; Express and its types | Native handlers supersede the Express router. The local `app.ts`/`index.ts` are adapted and retained for development, not deployed as a persistent server. |

Calendar4 credentials are not copied or used. Its old tracked credentials should be rotated independently.

## File tree

```text
api/
  health.ts
  ready.ts
  not-found.ts
  auth/
    session.ts
    logout.ts
    logout-all.ts
  research/
    index.ts
    import.ts
src/server/
  lib/{config,db,session-config}.ts
  models/{User,Session,ResearchWorkspace}.ts
  auth/{oauth-user,sessions,session-http}.ts
  http/{response,json}.ts
  research/{handler,validation,workspaces}.ts
  examples/oauth-callback.ts
  scripts/{check-db,revoke-user-sessions}.ts
  app.ts
  index.ts
src/client/                  # Typed API and session/research lifecycle
src/components/account/      # Optional native account/import controls
src/useAccountWorkspace.ts
vercel.json
```

The [exact changed-file list](mongodb-backend-files.md) accompanies the implementation verification report. `src/useWorkspace.ts` and `src/workspace.ts` retain the original local research contract.

## Install and run

```sh
npm ci
cp .env.example .env
# Set a fresh MONGODB_URI and APP_ORIGIN=http://127.0.0.1:5173.
npm run db:check
npm run server:dev
# In a second terminal:
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api`, `/health` and `/ready` to Node on loopback port 3001; the browser sees a single origin. Keep Vite on the configured port (for example `npm run dev -- --strictPort`), or change APP_ORIGIN to its actual origin. The local proxy targets port 3001; update it if changing PORT. Compiled local API: `npm run server:build && npm run server:start`; files emit into `dist-server/src/server` and `dist-server/api`. Vercel directly invokes API exports and never starts that listener.

Required runtime package: **mongoose 9.12.1**. Development runner: **tsx 4.23.15**, plus the existing TypeScript/Node types. Express, its types, dotenv, CORS, Next.js, NextAuth and a second Mongo driver are unnecessary. Node loads `.env` for local commands; Vercel supplies environment variables directly. No existing Three.js/React dependencies are upgraded.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Server only | Fresh database URI including database name. Required for DB work; never use a `VITE_` prefix. |
| `APP_ORIGIN` | Server only | Exact browser origin. Production must explicitly use HTTPS. Local Vite example: `http://127.0.0.1:5173`. |
| `SESSION_TTL_DAYS` | Server only | Optional, 30 by default, integer 1–365. |
| `HOST`, `PORT` | Local Node only | Optional, `127.0.0.1` and `3001`. |
| `NODE_ENV` | Server runtime | `production` on the deployed API; requires HTTPS APP_ORIGIN. |
| `VITE_API_ENABLED` | Public build flag | Exactly `true` enables account API UI. Unset/false retains local-only Pages behavior and makes no session API calls. Restart Vite/rebuild after changing. |
| `TEST_MONGODB_URI` | Tests only | Disposable loopback `first_light_backend_test` database; tests delete fixtures and reject remote/credentialed URIs. |

Opaque sessions require **no session signing secret**: a 256-bit random cookie token is hashed with SHA-256 in MongoDB. A future provider library will need its own fresh client credentials and state/PKCE/nonce protection; document those when choosing a provider. Never reuse Calendar4 secrets. Cookies are HttpOnly, host-only, SameSite=Lax, Path=/; HTTPS additionally uses Secure and the `__Host-` prefix. Token values never enter JSON, browser storage or logs.

## Reuse the existing Atlas cluster

A new MongoDB **cluster** is not required. The existing Calendar4 Atlas cluster can host a separate database named `first_light_test`, subject to its existing capacity and limits. A cluster is the MongoDB deployment; a database is a named namespace within it; collections are the documents grouped inside that database. Database isolation does not isolate cluster-wide compute, storage limits or network settings.

```text
Existing Atlas cluster
  Calendar4 database       -> its existing collections, unchanged
  first_light_test         -> users, sessions, research_workspaces
```

In the existing Atlas project:

1. Select the cluster already used by Calendar4. Under its data/collections browser, create the `first_light_test` database with an initial `research_workspaces` collection, or let the application create collections on its first writes. Empty collections are fine; account and session indexes are installed by their storage services when used.
2. Under Database Access, create a fresh application database user with `readWrite` scoped **only to `first_light_test`**, rather than reusing Calendar4's credentials. Atlas database users are separate from both Atlas dashboard users and First Light application users.
3. Use the cluster's Connect / Drivers instructions to obtain its `mongodb+srv` connection-string template. Set its database path to `/first_light_test`, use the new database user's credentials, preserve the driver's recommended query parameters and percent-encode reserved characters in credentials. Set the complete value as Vercel's server-only `MONGODB_URI`; do not commit or paste it into chat. No backend code change is required to select the database.
4. Allow the Vercel function deployment's connections in Atlas network access using the hosting/network arrangement selected for this project. A laptop-only IP entry is insufficient. Atlas network access is cluster/project infrastructure: review its effect on Calendar4 instead of assuming a separate database creates separate network rules.
5. Check `/api/ready` on the actual Vercel test deployment. It should return 200 with `{ "status": "ready" }`; 503 means the connection/configuration needs investigation through sanitized function logs.

Sharing Calendar4's actual database/collections is not the default: both applications use a `users` collection with different schemas, and Calendar4's NextAuth JWT sessions are not First Light's opaque database sessions. Existing Calendar4 accounts do not automatically become signed-in First Light users. Any reuse of existing test records needs an explicit, sanitized copy/adaptation into the isolated database and verified ownership; never copy active session tokens as fixtures. No live Calendar4 data or credentials were read or migrated for this implementation.

A file/object storage service can hold uploads or JSON exports, but it is not a drop-in replacement for Mongoose queries, session expiry/revocation, ownership indexes and atomic revision checks. The current backend can reuse the existing Atlas cluster directly; replacing MongoDB storage would be a separate implementation.

The destructive automated integration suites must continue using their disposable loopback `first_light_backend_test` database. They intentionally reject Atlas connection strings, including the hosted `first_light_test` database. Hosted checks use normal API requests and dedicated test accounts, not the fixture-deletion test runner.

## Login extension point — intentionally not a working login

`src/server/examples/oauth-callback.ts` is **server-only scaffolding**, not a mounted route, identity verifier or sign-in button. Add `/api/auth/<provider>/start` and `/api/auth/<provider>/callback` only after selecting a provider/library. The start handler must set short-lived flow state/PKCE data and redirect to a configured issuer. The callback must exchange the authorization code and verify state, PKCE, nonce where applicable, signature, issuer, audience and expiry (or the provider-specific verified identity response). Then call `onVerifiedOAuthSessionCallback(request, response, configuredProvider, verifiedClaims)` and redirect to a fixed local app destination. Never accept a browser user ID or unsigned claims as proof of identity. Do not auto-link by email.

The API/session/storage is implementable and testable before that provider flow, but a visitor cannot newly sign in until it is connected. Tests use trusted fixture users and server-only issuance; those fixture routes are never deployed.

## Research ownership and requests

A `research_workspaces` document contains `{ ownerId, workspace, revision, createdAt, updatedAt }`. The embedded version-1 workspace preserves source/decision IDs and references. A unique owner index allows one workspace per user. Every query and write uses the `requireSession` principal's `userId`; no query/body/header identity selects an owner. The browser account header is only an equality precondition against that principal, preventing an old tab from writing its old account's snapshot after another tab switches the cookie.

| Endpoint | Behavior |
| --- | --- |
| `GET /api/health` (`/health`) | Process liveness; does not connect MongoDB. |
| `GET /api/ready` (`/ready`) | Read-only MongoDB ping; 503 if unavailable. |
| `GET /api/demo` | Test backend button: read at most three names from `sample_mflix.users`; no writes. Passwords, emails and other fields are excluded. |
| `GET /api/auth/session` | Safe user/expiry or `{authenticated:false,user:null}`. |
| `POST /api/auth/logout` | Revoke current token and clear cookie. |
| `POST /api/auth/logout-all` | Revoke all sessions for the authenticated user. |
| `GET /api/research` | Only current user's `{workspace,revision}`; empty revision 0 if not saved yet. |
| `PUT /api/research` | Explicit replacement with `{workspace,expectedRevision}`; 409 if the revision no longer matches. |
| `POST /api/research/import` | Explicit append-only merge of the same payload; identical IDs are skipped, conflicting IDs rejected atomically. |

The read-only sample button needs the database credential to have read access to
`sample_mflix.users` in addition to its existing First Light permissions. A role
restricted to `first_light_test` does not include that sample collection. Keep
`MONGODB_URI` pointed at First Light's database; this one fixed query selects the
sample database using the same connection pool. It never selects `dev7`, accepts
client-selected namespaces, or creates sample records. An unavailable connection
or insufficient permission returns 503 with a fixed diagnostic code, never fake
data, a driver message, or a connection string.

All research responses are private `no-store` with `Vary: Cookie`. Unsigned/expired/revoked sessions return 401; mutations require an exact matching Origin (403 otherwise). Writes require `Content-Type: application/json` and `X-First-Light-Account: <last verified user.id>`; missing/mismatched account precondition returns 409. GET accepts that header and checks it if supplied. It is **not** authentication. A read is not a login, and a client user ID never establishes a session.

Payloads are limited to 1 MiB, 500 sources and 1000 decisions, with per-field lengths, valid HTTP(S) URLs, dates, allowed statuses and intact source references. Unknown fields/ownership keys are rejected. Each save/import is one Mongo document update with compare-and-swap revision protection: sources and decisions cannot be partially imported. No multi-document transaction or replica set is needed. A duplicate import with no changes does not increment the revision. This intentionally small foundation has no pagination, collaborative merge or background autosync.

Example browser calls (HttpOnly cookie is attached by the browser):

```ts
const session = await fetch('/api/auth/session', {
  credentials: 'same-origin', cache: 'no-store',
}).then(response => response.json())
if (!session.authenticated) throw new Error('Sign in first')
const headers = { 'X-First-Light-Account': session.user.id }
const current = await fetch('/api/research', {
  credentials: 'same-origin', cache: 'no-store', headers,
}).then(response => response.json())
// Only after an explicit import action; browser adds same-origin Origin itself.
const response = await fetch('/api/research/import', {
  method: 'POST', credentials: 'same-origin', cache: 'no-store',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ workspace: exportedBrowserWorkspace, expectedRevision: current.revision }),
})
if (!response.ok) throw new Error('Import was not saved; keep the backup and inspect the error')
```

Use the typed client for application code so failures, 401s, account changes and revisions are handled consistently. Its 20-second timeout prevents a stalled network request from locking the controls indefinitely; pending requests, timers and listeners are cleaned on completion or cancellation. A timeout does not prove a write failed, so reload before retrying (revision checks and idempotent import protect stored data). No CORS or third-party cookies are needed. There is no service-worker/API cache.

## Explicit import, logout and account changes

Anonymous work continues to use `first-light.workspace.v1` in localStorage. Account research stays in memory, never in that shared anonymous key. Signing in loads an empty/existing account workspace, not the local draft. Import requires a separate deliberate action; the original local records remain untouched. Exported version-1 JSON can be selected for import after sign-in, so the previous Pages origin need not be accessible to the new host.

Logout clears account data and account-specific UI immediately, aborts/invalidates outstanding requests and asks the server to revoke the cookie. Failed logout must remain visibly locked with retry instead of claiming revocation succeeded. Account changes and authentication rechecks gate old data; stale responses cannot restore it. Browser tab notifications and focus/visibility revalidation prevent keeping an old account cache on display after a switch; the backend account precondition also rejects stale writes. Browser-local anonymous research is an explicitly shared device-local draft, not an account cache, and is retained as the import backup.

Import does not overwrite existing research with conflicting IDs. Resolve those conflicts deliberately (for example by exporting both versions and reconciling them); do not autoassign the local draft to the next account. If an origin changes, localStorage and host cookies do not travel with it. Export on the existing Pages origin **before** switching hosts, sign in on the new origin, then explicitly select/import that file. Existing code deployment cannot transfer inaccessible origin storage.

## Verification and deployment gates

```sh
npm run typecheck
npm test
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/first_light_backend_test npm run server:test
npm run build
npm run db:check
```

Without TEST_MONGODB_URI, destructive integration tests are skipped and must not be claimed as passed. The validation-only GitHub workflow runs them against a disposable MongoDB service. No lint script is configured. Production bundle budgets still apply and server modules/credentials must not ship into frontend chunks.

Keep the existing Pages site/workflow until a separately approved Vercel Preview is validated. Create a Vite project using Node 24, root build/output config from `vercel.json`, a fresh protected MongoDB connection reachable from the host, production HTTPS APP_ORIGIN and `VITE_API_ENABLED=true`. Set APP_ORIGIN to the exact Preview origin for Preview; do not blindly use the production hostname for every branch. Check API file discovery/tracing, nested `/api/research` routes, JSON 404 fallback, cookies, origin checks, DB readiness and model/static URLs on the **real Preview**. Local Node/Vite tests do not prove Vercel routing. Each warm function may have its own pool (maximum 5 per instance), so monitor Atlas connections under scale. Apply indexes with appropriate DB permissions and use provider login/rate protections before exposing a live sign-in flow. Only then approve production cutover. This task does not deploy, configure a real provider or migrate existing origin data.

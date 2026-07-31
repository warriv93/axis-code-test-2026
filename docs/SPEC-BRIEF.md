# Spec Brief — Axis code test

Status: **awaiting sign-off** · Phase 0 output of `/deep-plan`

## Objective

Extend the provided graphql-yoga server with Users mapped to Cameras (task 1), and build a
React + TypeScript + Fluent UI v9 app that shows the logged-in user's cameras (task 2).

## Success criteria — measurable "done"

1. `npm install && npm run dev` starts backend (`:4000/graphql`) and frontend (`:5173`).
2. GraphQL schema exposes `users`, `cameras`, `me`, `login`, `addCamera`,
   `assignCameraToUser`, `unassignCameraFromUser`.
3. `login(username)` returns a token; `me` resolves the correct user from that token;
   `me` is `null` without a token.
4. `assignCameraToUser` / `unassignCameraFromUser` mutate the link only — the Camera
   survives unassignment and is re-assignable.
5. A user cannot assign/unassign cameras for a _different_ user → `FORBIDDEN`.
6. Frontend: log in → see that user's cameras → assign an unassigned fleet camera →
   remove one → list updates without a manual refresh. Reload keeps you logged in.
7. Loading, empty and error states are visible (no blank screens).
8. Every camera card — in both the "My cameras" and "Available in fleet" sections — shows
   the device's product photo; a missing `imageUrl` degrades to an icon, never a broken image.
9. `npm test` green in both packages; one Playwright e2e covers the flow in (6).
10. `npm run lint` (prettier) passes.
11. Code is pushed to the public repo `warriv93/axis-code-test-2026`.

UI reference: the signed-off mock (login → my cameras → fleet → assign/remove → dark mode).

## Domain model (ubiquitous language)

| Term                  | Meaning                                                              |
| --------------------- | -------------------------------------------------------------------- |
| **Camera**            | An Axis device in the fleet. Exists independently of any user.       |
| **User**              | An operator who logs in. Identified by `username`.                   |
| **Fleet**             | All cameras known to the system.                                     |
| **Assignment**        | Many-to-many link User↔Camera. Grants a user visibility of a camera. |
| **Unassigned camera** | A fleet camera not linked to the current user — assignable.          |
| **Token**             | Opaque string returned by `login`, maps to exactly one `userId`.     |

## Schema (target)

```graphql
type Query {
  cameras: [Camera!]! # whole fleet (7 seeded)
  users: [User!]! # for the login screen
  me: User # null when unauthenticated
}

type Mutation {
  login(username: String!): AuthPayload!
  addCamera(name: String!, niceName: String, address: String!): Camera! # unchanged
  assignCameraToUser(userId: ID!, cameraId: ID!): User!
  unassignCameraFromUser(userId: ID!, cameraId: ID!): User!
}

type AuthPayload {
  token: String!
  user: User!
}
type User {
  id: ID!
  username: String!
  displayName: String!
  cameras: [Camera!]!
}
type Camera {
  id: ID!
  name: String!
  niceName: String
  address: String!
  imageUrl: String # product photo, served from the frontend's /public
  users: [User!]!
}
```

## Seed fleet (7 cameras — the 2 provided + 5 added)

| id  | Model         | Nice name                               | Address       |
| --- | ------------- | --------------------------------------- | ------------- |
| 0   | A8207-VE MKII | _(none — exercises the nullable field)_ | 192.168.1.101 |
| 1   | I8307-VE      | My Device                               | 192.168.1.102 |
| 2   | P3265-LVE     | Lobby Dome                              | 192.168.1.103 |
| 3   | M2036-LE      | Parking Bullet                          | 192.168.1.104 |
| 4   | Q6135-LE      | Perimeter PTZ                           | 192.168.1.105 |
| 5   | P1467-LE      | Loading Bay                             | 192.168.1.106 |
| 6   | M3216-LVE     | Stairwell                               | 192.168.1.107 |

Seed users: `alice` (cameras 0,1,2), `bob` (4,5), `carol` (none — exercises the empty state).

## Camera images

Real Axis product photos, downloaded from axis.com and committed to
`packages/frontend/public/camera-images/` (~143 KB total, webp). Not hotlinked, so the app
and the e2e test work offline. `docs/CREDITS.md` attributes Axis as the source. A camera with
`imageUrl: null` falls back to a Fluent icon placeholder — the UI must not break.

Auth transport: `Authorization: Bearer <token>` → yoga context → `context.userId`.

## Decisions (locked in Phase 0)

| #   | Decision                                                                    | Rationale                                                                |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Passwordless `login(username)` returning an opaque token                    | Real auth _seam_ without crypto scope creep                              |
| 2   | Many-to-many assignment, not ownership                                      | Shared site cameras are the real Axis case; remove stays non-destructive |
| 3   | Explicit `userId` arg + authorization check                                 | Keeps schema admin-extensible and yields a testable `FORBIDDEN` path     |
| 4   | In-memory data behind repository interfaces                                 | No DB setup for the reviewer; fresh store per test; swappable            |
| 5   | Apollo Client                                                               | Normalized cache updates the list after mutations for free               |
| 6   | graphql-codegen → typed hooks                                               | Zero schema/client drift; single source of truth                         |
| 7   | Vitest + RTL + one Playwright e2e                                           | Every layer proven, not assumed                                          |
| 8   | Fluent UI v9, griffel styling, light/dark toggle                            | Meets the stated requirement, idiomatic                                  |
| 9   | 7 seeded cameras with real Axis product photos, committed locally           | Demo has substance; offline-safe and test-stable                         |
| 10  | Public repo `warriv93/axis-code-test-2026`, described "Axis Camera Manager" | Shareable link for the interviewer                                       |

## Chosen extras (beyond the README)

| Extra                                 | What it is                                                                                                        | Why                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **GitHub Actions CI**                 | Lint + backend tests + frontend tests + Playwright on every push; badge in README                                 | Reviewer sees a green build before reading code                |
| **Optimistic UI + Fluent `Toaster`**  | Assign/remove applies instantly, rolls back on error, toast confirms                                              | Demonstrates real Apollo cache control, not refetch-everything |
| **Camera detail drawer**              | Click a card → Fluent `Drawer`: large photo, model, nice name, IP, status, and everyone the camera is assigned to | Gives `Camera.users` a purpose; otherwise it is dead schema    |
| **Fleet search + `Skeleton` loaders** | `SearchBox` filters by model / nice name / IP; skeletons while loading                                            | Cheap, visible polish; no-match state included                 |
| **axe-core in the e2e**               | Playwright asserts zero critical a11y violations                                                                  | Axis sells into EU public sector (EN 301 549)                  |
| **Schema snapshot test**              | Fails if the SDL changes unintentionally                                                                          | Treats the schema as a public contract                         |

Deliberately **not** built — each is a talking point rather than a gap:

- **GraphQL subscriptions** — the strongest demo, but the highest risk of eating an hour and
  destabilising the e2e test. Cut on time discipline, not capability.
- **DataLoader / N+1 batching** — meaningless against in-memory arrays. The honest answer is
  "here is where it goes once this is backed by a database".
- **Relay global IDs / `Node`** — over-engineering at 7 cameras.
- **Drag-and-drop assignment** — flashier, but worse for keyboard and screen-reader users.
- **Docker Compose** — `npm run dev` already works; a compose file adds a setup step.

Revised budget: **~6.5–7 h**, up from the README's 3–4 h. Accepted knowingly. If time runs
short the drawer is the first thing to cut, since nothing else depends on it.

## Non-goals (explicit)

- Passwords, password hashing, refresh tokens, session expiry, real JWT signing.
- Persistent storage / database / migrations. Restart resets data.
- User CRUD (users are seeded), camera deletion from the fleet.
- Pagination, search, filtering, live video, RBAC/roles, i18n, deployment/CI.
- Rate limiting, CSRF, HTTPS, production hardening.

## Edge cases & failure modes

| Case                                 | Behaviour                                          |
| ------------------------------------ | -------------------------------------------------- |
| `login` with unknown username        | `GraphQLError` code `UNAUTHENTICATED`              |
| `me` with no/invalid token           | `null` (not an error)                              |
| Assign a camera already assigned     | Idempotent, no duplicate                           |
| Unassign a camera not assigned       | Idempotent no-op                                   |
| Unknown `userId` / `cameraId`        | `NOT_FOUND`                                        |
| Acting on another user's assignments | `FORBIDDEN`                                        |
| Backend down / network error         | Fluent `MessageBar` with retry, never a blank page |
| User has zero cameras                | Explicit empty state, not an empty box             |

## Constraints

- Node + npm workspaces monorepo as provided; keep the existing `addCamera` mutation working.
- Stack fixed by README: React, TypeScript, Fluent UI v9.
- Budget ~3–4 h. Codegen + dark mode were chosen knowing they add ~45 min.
- Free/local tooling only.

## Risks

- Fluent UI v9 + Vite + Apollo peer-dep friction → resolve early, in slice 0.
- graphql-codegen watch vs. `ts-node` ESM loader quirks in this starter.
- Playwright needs both servers up; keep the e2e to a single flow.

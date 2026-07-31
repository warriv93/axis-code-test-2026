# Build plan — Axis Camera Manager

The plan agreed before any code was written. Kept in the repo unchanged so the reasoning is
auditable against the result.

**Repo:** `warriv93/axis-code-test-2026` · **Stack:** graphql-yoga · React · TypeScript ·
Fluent UI v9 · Apollo Client · Vitest · Playwright

---

## 1. What the tasks asked for

| Task | Requirement                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------- |
| 1    | Extend the GraphQL server to map Users to Cameras; add + remove a camera on a User; a User must be loggable-in for task 2 |
| 2    | React + TypeScript + Fluent UI v9 app showing the cameras of the currently logged-in user                                 |

Everything below is either a direct reading of that, or a decision recorded with its reason.

---

## 2. Decisions, and why

| #   | Decision                                                  | Alternative rejected                       | Reason                                                                                                                              |
| --- | --------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Passwordless `login(username)` returning an opaque token  | Real password hashing                      | Gives a genuine auth _seam_ (token → context → resolver) without spending the budget on crypto that was never asked for             |
| 2   | **Many-to-many** User↔Camera                              | One-to-many ownership                      | A site camera is realistically watched by several operators. Also makes "remove" a link change, not a delete — no data is destroyed |
| 3   | Mutations take an explicit `userId` + authorization check | Implicit `addCameraToMe`                   | Keeps the schema admin-extensible and produces a testable `FORBIDDEN` path. Hiding the user hides the authorization concept         |
| 4   | In-memory data behind repository interfaces               | Module-level arrays (as provided) / SQLite | No DB setup for the reviewer, but each test gets a fresh store and swapping in a database is a one-file change                      |
| 5   | Apollo Client                                             | urql / plain fetch                         | Normalized cache updates the camera list after a mutation without a manual refetch                                                  |
| 6   | graphql-codegen → typed hooks                             | Hand-written types                         | Schema is the single source of truth; client and server cannot drift                                                                |
| 7   | Vitest + RTL + one Playwright e2e                         | Backend tests only                         | Every layer proven rather than assumed — see §5                                                                                     |
| 8   | Real Axis product photos, committed locally               | Hotlinked from axis.com                    | Works offline, keeps the e2e deterministic, and does not depend on someone else's CDN                                               |

Full detail, including edge cases and failure modes: [`docs/SPEC-BRIEF.md`](docs/SPEC-BRIEF.md).

---

## 3. Target schema

```graphql
type Query {
  cameras: [Camera!]! # the whole fleet
  users: [User!]! # populates the login screen
  me: User # null when unauthenticated — absence is not an error
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
  imageUrl: String
  users: [User!]!
}
```

Auth transport: `Authorization: Bearer <token>` → yoga context → `context.userId`.

Both assignment mutations are **idempotent**: assigning twice does not duplicate, unassigning
something absent is a no-op. Unknown ids give `NOT_FOUND`; acting on another user gives
`FORBIDDEN`.

---

## 4. Architecture

Deep modules behind narrow interfaces, dependencies pushed to the edges, so the core is
unit-testable without mocking a mock.

```
packages/backend/src
  domain/          Camera, User, Assignment types + pure rules. No I/O, no framework.
  repositories/    CameraRepository / UserRepository interfaces
                   + in-memory implementations. The swappable seam.
  auth/            TokenStore (token ⇄ userId), buildContext(request)
  graphql/         schema.ts, resolvers — thin. Translate GraphQL ⇄ domain, nothing more.
  main.ts          Composition root: builds repos, injects them, starts the server.

packages/frontend/src
  api/             Apollo client, generated hooks, auth link
  auth/            AuthProvider — token in localStorage, exposes `me`
  features/cameras/  CameraCard, CameraGrid, CameraDetailDrawer, FleetSearch
  app/             FluentProvider, theme toggle, routing between login and dashboard
```

Two rules that make the tests cheap:

- **Resolvers hold no logic.** Business rules live in the domain layer, so they are testable
  as plain functions and the GraphQL tests only have to check wiring.
- **Repositories are injected, never imported.** Every test constructs its own store, so no
  test can leak state into another.

---

## 5. Test strategy

| Level       | Tool                          | What it proves                                                                         |
| ----------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| Unit        | Vitest                        | Domain rules — idempotent assign, unassign a camera that isn't assigned, authorization |
| Integration | Vitest + `graphql` execute    | Real queries against the real schema, no mocked resolvers                              |
| Contract    | Snapshot test                 | The SDL cannot change unintentionally                                                  |
| Component   | RTL + Apollo `MockedProvider` | Loading, empty, error and populated states render                                      |
| E2E         | Playwright                    | Log in → see cameras → assign → remove → still correct after reload                    |
| A11y        | axe-core inside the e2e       | Zero critical violations                                                               |

Written test-first, per slice. A slice is not committed until its tests pass.

---

## 6. Build order

Each slice is independently testable and gets exactly one commit.

| #   | Slice                                                       | Tests written first                               |
| --- | ----------------------------------------------------------- | ------------------------------------------------- |
| 0   | Tooling: Vite, Vitest, Fluent, Apollo, codegen, Playwright  | build + empty suites run                          |
| 1   | Domain + repositories, 7 seeded cameras, 3 seeded users     | assignment rules, idempotency                     |
| 2   | `users` / `cameras` / `me` queries                          | schema snapshot, query integration                |
| 3   | `login` + token context                                     | valid login, unknown user, `me` without a token   |
| 4   | `assignCameraToUser` / `unassignCameraFromUser`             | happy path, idempotency, `NOT_FOUND`, `FORBIDDEN` |
| 5   | Frontend shell: FluentProvider, theme toggle, Apollo wiring | renders, theme switches                           |
| 6   | Login screen + persisted session                            | login flow, reload keeps session                  |
| 7   | Camera grid, skeletons, empty state, images                 | all four states render                            |
| 8   | Assign / unassign with optimistic UI + toasts               | optimistic apply, rollback on error               |
| 9   | Camera detail drawer                                        | opens, lists assignees, closes on Escape          |
| 10  | Fleet search                                                | filters by model / nice name / IP; no-match state |
| 11  | Playwright e2e + axe                                        | the full flow, zero critical a11y violations      |
| 12  | GitHub Actions CI + README                                  | pipeline green on push                            |

---

## 7. Scope boundaries

**Extras built beyond the brief** — CI with a status badge; optimistic UI with Fluent toasts;
camera detail drawer; fleet search and skeleton loaders; axe-core in the e2e; schema snapshot
test.

**Deliberately not built** — each a decision, not an oversight:

- **GraphQL subscriptions** (live multi-tab sync) — the most impressive option, and the most
  likely to consume an hour and destabilise the e2e. Cut on time discipline.
- **DataLoader / N+1 batching** — meaningless against in-memory arrays. The honest position is
  knowing where it goes once a database is behind the repositories.
- **Relay global IDs / `Node`** — over-engineering at seven cameras.
- **Drag-and-drop assignment** — flashier than a button, and worse for keyboard and
  screen-reader users.
- **Docker Compose** — `npm run dev` already works; a compose file only adds a setup step.

**Out of scope entirely** — passwords, refresh tokens, session expiry, persistent storage,
user CRUD, camera deletion, pagination, RBAC, i18n, deployment, production hardening.

---

## 8. Definition of done

1. `npm install && npm run dev` starts backend and frontend.
2. Log in → see that user's cameras → assign → remove → list updates without a refresh.
3. Reload keeps the session.
4. Loading, empty and error states all visible; no blank screens.
5. Every camera card shows its product photo; a missing image degrades to an icon.
6. A user cannot modify another user's assignments.
7. All suites green, including the e2e and the a11y assertion.
8. `npm run lint` passes; CI green on `main`.

**Budget:** the README suggests 3–4 h. The chosen extras take this to roughly 6.5–7 h. That
was a deliberate trade, recorded here rather than hidden. If time had run short, the detail
drawer was first to be cut — nothing else depends on it.

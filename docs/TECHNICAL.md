# Technical implementation

How the app works and why it is built this way. Companion to [PROCESS.md](PROCESS.md),
which covers _how_ it was built.

---

## 1. The pitch, in 60 seconds

An operator signs in and sees the cameras assigned to them. They can pull a camera in from
the shared fleet, drop one they no longer need, and open any camera to see its details —
including which other operators are watching it.

The interesting decision is the **User↔Camera relationship**. The brief says "add a camera to
a User" and "remove a camera from a User", which could mean ownership. I modelled it as a
**many-to-many assignment** instead:

- A camera exists in the fleet independently of any user.
- Several operators can be assigned the same camera — which is the real situation on a site,
  where a lobby camera is watched by both reception and security.
- "Remove" therefore severs a link, it never deletes hardware. There is a test asserting the
  camera survives, because the destructive reading is the dangerous one.

Everything else follows from that: `Camera.users` and `User.cameras` are both real edges, the
detail drawer can show who else is watching, and `unassign` is safely idempotent.

---

## 2. Architecture

Deep modules behind narrow interfaces, dependencies pushed to the edges.

```
packages/backend/src
  domain/         Camera, User, Assignment + seed data. Pure. No I/O, no GraphQL.
  repositories/   Three interfaces + one in-memory implementation.
  auth/           TokenStore, and header → identity decoding.
  graphql/        typeDefs, thin resolvers, error vocabulary.
  main.ts         Composition root: the only file that picks implementations.

packages/frontend/src
  api/            Apollo client, auth link, generated hooks.
  auth/           Token storage, useSession.
  features/       LoginScreen; Dashboard, CameraCard, CameraGrid, drawer, assignment hook.
  app/            Providers, header, theme.
```

Three rules do most of the work:

**Resolvers hold no logic.** They translate arguments into repository calls. Every rule worth
testing — idempotency, authorization ordering, the many-to-many edges — lives below GraphQL,
so it is testable as plain functions.

**Repositories are injected, never imported.** `createInMemoryStore(seed())` is called once in
`main.ts` and once per test. No test can leak state into another, and swapping in a database
means writing one new implementation of three interfaces and changing one line.

**Transport is decoded once, at the edge.** `buildContext` turns the `Authorization` header
into `context.userId`. No resolver ever sees a header.

---

## 3. Authentication

`login(username)` returns an opaque random token — deliberately **not** a JWT and
deliberately **not** derived from the username, so it cannot be forged by guessing. The
frontend stores it and the Apollo auth link attaches it as `Authorization: Bearer …` on every
request.

Two decisions worth defending:

**`me` returns `null` when unauthenticated, not an error.** The sign-in screen asks this
question precisely because it does not know the answer yet. Absence of a session is a normal
state, not a failure.

**`me` is the source of truth for the session, not the login response.** So a stale or revoked
token resolves to signed-out on the next load, rather than showing a user the server no longer
recognises.

---

## 4. Authorization

Both assignment mutations take an explicit `userId` and check it. The guard's **ordering is
the point**:

```ts
if (!ctx.userId) throw errors.unauthenticated(); // 1. who are you?
if (ctx.userId !== userId) throw errors.forbidden(); // 2. is it yours?
if (!user) throw errors.notFound("User"); // 3. does it exist?
if (!camera) throw errors.notFound("Camera");
```

Checking existence first would let an anonymous caller distinguish real ids from fake ones by
the error they get back. Similarly, a failed `login` never echoes the username, so the endpoint
cannot be used to enumerate accounts. Clients branch on `extensions.code`
(`UNAUTHENTICATED` / `FORBIDDEN` / `NOT_FOUND`), never on message text.

_Why an explicit `userId` rather than an implicit "me"?_ It keeps the schema honest and
admin-extensible, and it produces a `FORBIDDEN` path that can actually be tested. An implicit
mutation is impossible to misuse — and therefore impossible to demonstrate securing.

---

## 5. Frontend

**Typed end to end.** The backend prints its SDL to `schema.graphql`; graphql-codegen turns
that plus the `.graphql` documents into typed hooks. The schema is the single source of truth,
and CI fails if generated types drift from it. No running server is needed to generate.

**Optimistic updates.** Both mutations return the updated `User`, so an optimistic response of
the same shape lets Apollo update its normalised cache immediately — the card moves between
sections before the request lands, and Apollo rolls back by itself on failure. The `Fleet`
query is refetched alongside, because `Camera.users` also changes and that reverse edge is not
derivable from the mutation result.

**States are explicit.** Loading shows skeletons; an operator with no cameras gets a written
empty state; a failed fetch gets a `MessageBar` naming the likely cause; a camera without a
photo degrades to an icon rather than a broken image.

**The clickable region is obvious.** Each card's photo and title form one button. On hover it
lifts, its border turns brand blue, the thumbnail tints, the image scales, the title changes
colour, and a "Details ›" badge fades in. Scoped with `:has(button[data-open]:hover)` so
hovering _Remove_ tints only that button — the two affordances never compete. Every cue also
fires on `:focus-visible`, so keyboard users get the same signal.

---

## 6. Testing

| Level       | Tool                    | What it proves                                              |
| ----------- | ----------------------- | ----------------------------------------------------------- |
| Unit        | Vitest                  | Assignment rules, idempotency, token handling               |
| Integration | Vitest + `graphql`      | Real operations against the real schema; no mocked resolver |
| Contract    | Snapshot of the SDL     | The public API cannot change silently                       |
| Component   | RTL + `MockedProvider`  | Only the network is faked; hooks and cache run for real     |
| E2E         | Playwright              | The whole flow against the live server                      |
| A11y        | axe-core inside the e2e | Zero serious or critical WCAG 2.1 AA violations             |

**71 unit/integration/component tests and 9 end-to-end tests.** Written before the code they
cover, one commit per passing slice.

---

## 7. Trade-offs, stated plainly

| Decision                    | Cost                            | Why it is right here                                                                         |
| --------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| In-memory store             | Restart loses data              | No DB setup for a reviewer; the seam to replace is one interface                             |
| Passwordless login          | Not production auth             | Demonstrates the auth _seam_ without spending the budget on crypto nobody asked for          |
| Tokens in `localStorage`    | Readable by XSS                 | No cookie/CSRF infrastructure at this scale; httpOnly cookies would be the production answer |
| Refetch `Fleet` on mutation | One extra round trip            | Correct reverse edge beats a hand-written cache update that can silently rot                 |
| Committed product photos    | ~150 KB in the repo, Axis-owned | Works offline, keeps the e2e deterministic; attributed in CREDITS.md                         |

**Deliberately not built**, each a decision rather than an oversight:

- **GraphQL subscriptions** for live multi-tab sync — the most impressive option and the one
  most likely to eat an hour and destabilise the e2e. Cut on time discipline.
- **DataLoader / N+1 batching** — meaningless against in-memory arrays. The honest position is
  knowing exactly where it goes once a database sits behind the repositories.
- **Relay global IDs / `Node`** — over-engineering at seven cameras.
- **Drag-and-drop assignment** — flashier, and worse for keyboard and screen-reader users.

---

## 8. Four bugs the process caught

Worth showing, because each was invisible to the layer above it.

**1. The hover affordance was dead in the browser.** Griffel silently drops parent selectors
(`"parent:hover &"`). Every unit test passed — none of them assert computed styles. Found by
opening the app and reading `getComputedStyle`; fixed by moving the rules onto the button as
descendant selectors, then re-verified the same way.

**2. The theme toggle toggled nothing.** `useThemePreference` was called in both `App` and
`AppShell`, so the button mutated a state `FluentProvider` never saw. Fixed by lifting theme
ownership to `App`.

**3. The server crashed while the tests passed.** An over-specified `createYoga` generic
type-checked fine under esbuild — which strips types — but ts-node type-checks at runtime and
threw an opaque object. Only smoke-testing the real server over HTTP found it. This is why
every backend slice ends with a real HTTP check, not just a green suite.

**4. CI would have failed on its first run.** Prettier reformatted the generated
`schema.graphql`, so the codegen drift check found a diff every time. Caught by running the
full gate locally before pushing.

---

## 9. If this were going to production

1. **Persistence** — implement the three repository interfaces against Postgres; nothing above
   them changes. Add DataLoader at that point, and it will actually mean something.
2. **Real auth** — password hashing or SSO, short-lived tokens in httpOnly cookies, refresh
   and revocation.
3. **Subscriptions** — `cameraAssignmentChanged` over SSE, so an operations room stays in sync.
4. **Scale the list** — pagination and server-side filtering; the client-side filter is honest
   at 7 cameras and wrong at 7,000.
5. **Authorization as policy** — roles and a `@auth` schema directive once "can only manage
   your own" stops being the only rule.

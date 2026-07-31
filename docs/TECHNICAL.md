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
means writing one new implementation of three interfaces.

<details>
<summary>What adding a Postgres store (Database) would actually take</summary>

Write one new file returning the same `Store` shape:

```ts
// repositories/postgresStore.ts
export function createPostgresStore(pool: Pool): Store {
  return {
    cameras: {
      all: () => pool.query("SELECT * FROM cameras").then((r) => r.rows),
      byId: (id) =>
        pool.query("SELECT * FROM cameras WHERE id = $1", [id]).then(one),
      // …
    },
    users: {
      /* … */
    },
    assignments: {
      /* … */
    },
  };
}
```

Then change one line in the composition root:

```diff
- const store = createInMemoryStore(seed());
+ const store = createPostgresStore(pool);
```

**The honest caveat:** the interfaces are currently synchronous (`all(): Camera[]`), and no
database can satisfy that. So the real change is that the interfaces return `Promise<…>`, and
the six resolver branches that inspect a repository result — `me`, `login`, the two assignment
guards, `User.cameras`, `Camera.users` — become `async`/`await`. The rest is untouched: the
domain layer, the schema, every resolver that just forwards a result (graphql-js already
awaits whatever a resolver returns), and the tests, which only ever see the interface.

I left them synchronous deliberately, because an in-memory store returning promises for no
reason is noise. Worth knowing that the seam is right but not entirely free.

</details>

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

**78 unit/integration/component tests and 9 end-to-end tests.** Written before the code they
cover, one commit per passing slice.

The optimistic-assignment hook is tested directly rather than only through the end-to-end
run, because a failed rollback would leave the UI claiming the operator has a camera the
server just refused them. Those tests were themselves checked by breaking the hook four
ways — no optimistic response, swallowed error, never-cleared busy flag — and confirming the
right test failed each time.

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

Five things, in the order I would do them.

### 1. Persistence

Implement the three repository interfaces against Postgres, making them return promises; the
domain layer and the schema are untouched. Add DataLoader at that point, and it will actually
mean something.

- **Benefit:** data survives a restart, and more than one server instance can serve the same
  fleet.
- **Why that matters:** without it there is no deployment worth the name. Every deploy, crash
  or autoscale event silently erases every camera assignment — in a system that governs who
  may view surveillance footage, access quietly disappears with no warning and no way to
  restore it. Being single-process also rules out rolling deploys, failover and horizontal
  scale, so this is the precondition for the other four items rather than a feature beside
  them.

### 2. Real auth

Password hashing or SSO, short-lived tokens in httpOnly cookies, plus refresh and revocation.

- **Benefit:** sessions can actually be ended, and a token stops being readable by any script
  on the page.
- **Why that matters:** today a token is valid until the server restarts and cannot be
  withdrawn, so someone who leaves the organisation keeps working access to the camera fleet
  until a reboot happens to occur. And because the token sits in `localStorage`, any script
  that reaches the page — a compromised dependency, a single XSS — can lift it and act as
  that operator. For a system whose entire job is deciding who may watch a camera, "access
  cannot be revoked" and "a session can be stolen" are the two failures that matter most.

### 3. Subscriptions

`cameraAssignmentChanged` over SSE, so an operations room stays in sync.

- **Benefit:** two operators looking at the same fleet never disagree about who can see what,
  with no reload required.
- **Why that matters:** in a control room several people work the same site at once. If one
  revokes access to a camera and a colleague's screen still lists it, that colleague is acting
  on something untrue — believing coverage exists where it does not, or that someone can see a
  feed they no longer can. Manual refresh makes the window of wrongness unbounded and
  invisible; pushing the change makes it a few hundred milliseconds and self-correcting.
  Mechanically it is a PubSub in the composition root and a publish after each mutation, over
  SSE rather than WebSockets because it is plain HTTP that reconnects itself.

### 4. Scale the list

Pagination and server-side filtering; the client-side filter is honest at 7 cameras and wrong
at 7,000.

- **Benefit:** the page stays fast on a real fleet, and the browser stops downloading rows
  nobody will look at.
- **Why that matters:** transfer size and memory currently grow linearly with the deployment,
  so the app degrades fastest for the largest sites — the ones that matter most. The subtler
  cost is correctness: filtering client-side can only search what has already been
  downloaded, so the moment a fleet outgrows one payload the filter starts returning
  confidently incomplete results. Paging on the server keeps response size flat regardless of
  fleet size and makes the filter authoritative rather than best-effort.

**How to do this well.** Cursor-based, Relay-shaped, paginating the join:

```graphql
type User {
  cameras(first: Int!, after: String, filter: CameraFilter): CameraConnection!
}

type CameraConnection {
  edges: [CameraEdge!]!
  pageInfo: PageInfo! # hasNextPage, endCursor
  totalCount: Int # opt-in: this is the expensive field
}
```

Four points, in the order they matter:

1. **Cursors, not `offset`/`limit`.** `OFFSET 10000` makes the database walk 10,000 rows it
   will throw away, and any insert or deletion between page loads silently shifts the window
   so the operator skips or sees duplicate cameras. A cursor is an opaque encoding of a stable
   sort key — `WHERE (name, id) > ($lastName, $lastId) ORDER BY name, id LIMIT $first` — which
   an index satisfies in constant time per page, however deep you are.
2. **The Relay connection shape earns its verbosity.** It is what Apollo's
   `relayStylePagination()` expects, so "load more" becomes a cache policy rather than a
   hand-written merge function — and hand-written merges are exactly where duplicated and
   vanishing rows come from.
3. **Paginate the assignment, not the camera.** Because `cameras` is a field on `User`, the
   cursor runs over the join, so filtering and paging stay in one indexed query instead of
   fetching a user's cameras and then discarding most of them. The genuinely hard case is
   paging that nested list for _many_ users at once — the fix is a window function
   (`ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY name, id)`) to get top-N-per-user in a
   single round trip, batched through DataLoader, rather than one query per parent.
4. **Make `totalCount` optional.** It is a full `COUNT(*)` behind a pretty name; `hasNextPage`
   answers what the UI usually needs by fetching `first + 1` rows and discarding the extra.

At 7 cameras all of this is cost with no benefit, which is why the current implementation
filters client-side.

### 5. Authorization as policy

Roles and a `@auth` schema directive, once "can only manage your own" stops being the only
rule.

- **Benefit:** new rules arrive without editing resolvers, and enforcement stays consistent
  because it is declared next to the field it protects.
- **Why that matters:** authorization written inside resolver bodies drifts. Someone adds a
  mutation, forgets the guard, and nothing complains — the gap is invisible until it is found
  from the outside. Declaring the rule on the field makes an unprotected field visible in the
  schema itself, and turns "who may do what" into one reviewable artefact instead of an answer
  you assemble by reading every resolver. The pressure for this grows with the rule count:
  administrators, per-site scoping, read versus manage.

---

## 10. Future work — what would make this genuinely good

The list above hardens what exists. These three would make it a product.

### 1. Live snapshots from the devices

Replace the static product photo with the camera's current frame, fetched through Axis's own
VAPIX HTTP API and proxied by the backend.

- **Benefit:** the page stops being a directory and becomes an operations view — you can see
  at a glance that a camera is pointed at a wall, obscured, or dark.
- **Why it's a good talking point:** it uses Axis's actual device API, which shows you looked
  at the product rather than only the test. It also opens real engineering questions with
  right answers: device credentials must live server-side and never reach the browser;
  snapshots need throttling and a short cache so 50 tiles do not hammer 50 devices; and the
  fallback path already exists, because the UI is built to degrade when an image is missing.

### 2. Delegated assignment for administrators

Let an administrator grant and revoke camera access on behalf of another operator.

- **Benefit:** matches how access is really managed — an operator does not usually provision
  their own surveillance access; a supervisor does.
- **Why it's a good talking point:** the schema already supports it. `assignCameraToUser`
  takes an explicit `userId` precisely so it is not permanently welded to "me", so this is a
  change to one authorization guard, not a schema migration and a client rewrite. It is the
  cleanest available demonstration that the Phase 0 grilling paid for itself months early.

### 3. An audit trail of access changes

Record every assignment and revocation as an append-only event: who changed what, for whom,
and when.

- **Benefit:** answers "who could see this camera on 3 March, and who granted it?" — a
  question that gets asked after an incident, and one the current mutable assignment set
  cannot answer at all.
- **Why it's a good talking point:** access to surveillance footage is security- and often
  compliance-relevant, particularly for the EU public-sector customers Axis sells to, so this
  is product thinking rather than feature-adding. Architecturally it is a good contrast too:
  an append-only event log alongside mutable current state, where the same events can feed
  both the audit view and the subscriptions in §9.3 — one mechanism, two payoffs.

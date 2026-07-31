# Axis Camera Manager

[![CI](https://github.com/warriv93/axis-code-test-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/warriv93/axis-code-test-2026/actions/workflows/ci.yml)

Solution to the Axis code test: a GraphQL API that maps operators to cameras (task 1) and a
React + Fluent UI v9 app that manages them (task 2).

## Quick start

```bash
npm install
npm run dev
```

- App — <http://localhost:5173>
- GraphQL playground — <http://localhost:4000/graphql>

Sign in as **alice** (3 cameras), **bob** (2), or **carol** (none — shows the empty state).
No password: `login(username)` returns a bearer token. Data is in memory, so restarting the
server resets it.

## Commands

| Command                       | What it does                                     |
| ----------------------------- | ------------------------------------------------ |
| `npm run dev`                 | Backend and frontend together                    |
| `npm test`                    | Unit + integration tests (both packages)         |
| `npm run test:e2e`            | Playwright end-to-end, incl. accessibility check |
| `npm run build`               | Type-check both packages and build the frontend  |
| `npm run lint`                | Prettier check                                   |
| `npm run codegen -w frontend` | Regenerate typed hooks from the schema           |

## What was built

**Task 1 — GraphQL.** Users mapped to cameras as a **many-to-many assignment**: a camera can
be shared by several operators, and removing it from one never deletes it.
`assignCameraToUser` / `unassignCameraFromUser` are idempotent and reject acting on another
user with `FORBIDDEN`. `login` issues an opaque bearer token; `me` resolves it. The provided
`addCamera` mutation is untouched and has a regression test.

**Task 2 — React.** Sign in, see your cameras, add from the fleet, remove, and open a camera
for detail — including every operator it is shared with. Fluent UI v9 throughout, with
optimistic updates, toasts, skeletons, explicit empty/error states, fleet search, and a
persisted light/dark theme.

**Beyond the brief:** CI, a schema-contract snapshot test, an axe-core accessibility
assertion in the e2e run, and 7 seeded cameras with real Axis product photos.

## Documentation

| Document                                 | What it covers                               |
| ---------------------------------------- | -------------------------------------------- |
| [docs/PLAN.md](docs/PLAN.md)             | The plan agreed before any code was written  |
| [docs/TECHNICAL.md](docs/TECHNICAL.md)   | Architecture, decisions and trade-offs       |
| [docs/PROCESS.md](docs/PROCESS.md)       | How it was built                             |
| [docs/SPEC-BRIEF.md](docs/SPEC-BRIEF.md) | Requirements, edge cases, definition of done |
| [docs/CREDITS.md](docs/CREDITS.md)       | Attribution for the Axis product photography |

## Testing

| Level       | Covers                                                            |
| ----------- | ----------------------------------------------------------------- |
| Unit        | Assignment rules, idempotency, token handling                     |
| Integration | Real queries against the real schema, no mocked resolvers         |
| Component   | Loading, empty, error and populated states                        |
| End-to-end  | Full flow against the live API, plus zero serious a11y violations |

---

<details>
<summary>Original task description</summary>

## Getting started

This is a monorepo with two packages, backend and frontend, using npm workspaces. Easiest way to get started with the test is to fork this repo do the tasks there. When you're done send us a link to your fork.

If you run into any issues or have questions don't hesitate to contact the technical interviewer.

### Tools

- NodeJS
- GitHub

### Start dev eniroment

1. `npm install`
2. `npm run dev` to start both backend and frontend.
3. Access GraphQL-devtool on http://localhost:4000/graphql

## Task 1: Extending the GraphQL Server with more types

### Objectives

- Extend the existing GraphQL server to map Users to specific Cameras.
  - Keep in mind that you should be able to log in using a User in Task 2.
- Add funtionality to add a camera to a User
- Add funtionality to remove a camera from a User

## Task 2: Create a React app that consumes the previous GraphQL-API

### Requirements

- React
- Typescript
- Fluent UI v9

### Objective

Create a React app in the "frontend"-package that displays all cameras related to the currently logged in user. Use the API you've extended in task 1.

</details>

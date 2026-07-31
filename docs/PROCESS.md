# How this was built

Companion to [TECHNICAL.md](TECHNICAL.md), which covers _what_ was built.

---

## The `/deep-plan` skill

The whole build was run through **`/deep-plan`** — a Claude Code orchestrator skill for
taking a feature idea to a verified implementation _without_ skipping the boring-but-critical
steps. Instead of jumping straight to code, it enforces a gated sequence:

> **Grill → Spec → Deep-modular architecture → SDD + TDD build → Verify → Human review**

It's an _orchestrator_: rather than reinventing each step, it composes other skills
(interrogation, domain modelling, deep-module design, ADR, test-driven development, bug
diagnosis) and adds the connective tissue — cheap context-isolated slices, one commit per
passing slice, a looping verification gate, and a final honest debrief. It also runs on a
cost-discipline rule: local tooling only, no paid external calls.

The value for this project: nothing got written until we agreed _exactly_ what "done" meant,
the architecture was chosen for testability up front, and every layer shipped with tests and
was proven working — not just assumed.

---

## What each phase actually produced

### Phase 0 — Grilling, before a line of code

Three rounds of interrogation, one decision at a time, each with a recommended answer to
argue against. The questions that mattered were the ones where the brief was genuinely
ambiguous:

- Is "add a camera to a User" **ownership or assignment**? → many-to-many assignment.
- Should mutations take an explicit `userId` or act implicitly on "me"? → explicit, so
  authorization becomes testable.
- What does "logged in" mean when no auth was specified? → passwordless token, a real seam
  without crypto scope creep.

Output: [SPEC-BRIEF.md](SPEC-BRIEF.md) — objectives, measurable success criteria, edge cases,
failure modes, and explicit non-goals. Signed off before Phase 1 started.

**A mock came before the spec was closed.** A clickable HTML prototype of the frontend was
built and reviewed first, which is how the detail drawer, fleet search and hover affordance
got specified rather than discovered halfway through the build.

### Phase 1 — Architecture chosen for testability

Deep modules, narrow interfaces, dependencies at the edges. The specific goal was that every
slice could be built and tested in isolation: repositories injected rather than imported,
resolvers holding no logic, transport decoded once at the edge. Recorded in
[PLAN.md](../PLAN.md) before implementation.

### Phase 2 — Spec-driven task list

The architecture became a dependency-ordered list of 13 slices, each with its tests named
first. That list is §6 of [PLAN.md](../PLAN.md), and it is what the build followed.

### Phase 3 — TDD, one commit per passing slice

Every slice ran red → green → refactor. The git history is the evidence:

```
chore: initial commit of provided Axis starter repo   ← unmodified, so the diff is honest
docs: add spec brief and build plan                   ← plan committed before code
chore(slice-0): toolchain and test infrastructure
feat(slice-1): domain model, repository seams, seed fleet
feat(slice-2): users/cameras/me queries behind injected context
feat(slice-3,4): token auth and the assignment mutations
feat(slice-5..10): the React app
test(slice-11,12): Playwright e2e with axe, CI, README
```

The first commit is the untouched starter on purpose: it makes every later diff unambiguously
mine.

### Phase 4 — Verification, looped until clean

A five-gate check run before every push: **lint → build → codegen drift → 71 unit/integration
tests → 9 e2e tests**. Failures went back into the loop rather than being noted and shipped.

### Phase 5 — Honest debrief

Including the compromises and weak points, not just the wins. Those are §7 and §9 of
[TECHNICAL.md](TECHNICAL.md).

---

## What the process actually bought

Four defects were caught that would otherwise have shipped, and **none of them were visible
to the layer above**:

| Defect                                                               | Caught by                                    |
| -------------------------------------------------------------------- | -------------------------------------------- |
| Card hover affordance silently dead (griffel drops parent selectors) | Reading `getComputedStyle` in a real browser |
| Theme toggle mutated state the provider never saw                    | Reviewing the composition, not the test      |
| Server crashed on boot while every test passed                       | Smoke-testing the real server over HTTP      |
| CI would have failed on its first run (prettier vs. codegen)         | Running the full gate locally before pushing |

The pattern is the point: **green tests are necessary, not sufficient.** Three of the four
were found by exercising the real thing — a browser, an HTTP request, the actual CI sequence.
That is why each backend slice ends with a live HTTP check and each frontend slice ends with
a browser check, rather than a test count.

---

## Honest notes on the process

- **The budget moved.** The README suggests 3–4 hours. Codegen, dark mode, the detail drawer,
  search, a11y assertions and CI took it to roughly 6–7. That was a deliberate trade, recorded
  in the plan rather than hidden.
- **Slices merged as they went.** The plan had 13 slices; the history has 8 commits, because
  frontend slices 5–10 were too interdependent to commit separately without committing
  something broken. The rule "never commit red" won over the rule "one commit per slice".
- **Two environment problems ate real time** and neither was project code: a hoisted
  `@types/react` 19 shadowing React 18, and an interrupted `npm install` leaving a partial
  lockfile that npm then faithfully reproduced. Both are noted in the commit messages so the
  history explains itself.

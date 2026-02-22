# QA Strategy — Angular ToDo App

This document answers the key architectural and strategic questions behind the test automation approach chosen for this project.

---

## 1. Pattern Choice: Page Object Model

### Why POM?

The Page Object Model was chosen over alternatives such as Screenplay or plain helper functions for the following reasons:

| Criterion | POM | Screenplay | Plain helpers |
|-----------|-----|-----------|---------------|
| Learning curve | Low | High | Very low |
| Maintainability | High | Very high | Low |
| Reusability | Medium | High | Medium |
| Appropriate for project size | ✓ Single-screen SPA | Overkill | Insufficient isolation |

**POM fits this project because:**
- The application has a single view with a well-defined set of interactions (add, edit, delete, toggle, filter). A single `TodoPage` class cleanly models the entire UI.
- Locator changes (e.g., a CSS class rename) require updates in exactly one place — the POM class — rather than across every test file.
- The POM approach is the de facto Playwright standard, so it is immediately legible to any engineer joining the project.

### How POM is applied here

`tests/pages/todo.page.ts` exposes:
- **Locator properties** (`taskList`, `errorMessage`, `filters`, …) — lazy Playwright `Locator` objects declared in the constructor.
- **Action methods** (`addTask`, `editTask`, `deleteTask`, `toggleTask`, `filter`) — `async` methods that encapsulate multi-step interactions.
- **`taskLocator(title)`** — a factory that returns a scoped `Locator` using `.filter({ has })` instead of fragile CSS string interpolation.

Tests never access `page.locator()` directly; they consume only the POM's public API.

---

## 2. Working with the Asynchronous API

### The challenge

The application talks to the JSONPlaceholder REST API (`https://jsonplaceholder.typicode.com/todos`), which:
- Accepts POST/PUT/DELETE but does **not persist** changes.
- May introduce network latency.
- Returns server-generated IDs that the UI depends on.

Running tests against the live API would make the suite:
- **Non-deterministic** — latency and rate limits vary.
- **Stateful** — shared global state across test runs.
- **External-dependency-prone** — outages fail the entire suite.

### The solution: `ApiMock` + `page.route()`

`tests/helpers/api.mock.ts` defines `ApiMock`, a class that wraps `page.route()` to intercept all `/todos**` requests and return controlled, in-memory responses.

Key design decisions:

1. **Single route pattern** (`**/todos**`) handles GET, POST, PUT `/todos/:id`, and DELETE `/todos/:id` in one handler, dispatching by HTTP method and whether the URL contains a numeric path segment.
2. **`setup()` always calls `page.unroute()` first**, so any test can override the default stub without accumulating stale handlers.
3. **Callbacks (`onPost`, `onPut`, `onDelete`)** allow individual tests to inspect request payloads without global side effects.
4. **Optional `delay` and `error` flags** simulate adverse network conditions in isolation.

### Request/response assertions

For tests that verify the exact payload sent to the server, `page.waitForRequest()` / `page.waitForResponse()` are used via `Promise.all`:

```typescript
const [request] = await Promise.all([
  page.waitForRequest(req => req.url().includes('/todos') && req.method() === 'POST'),
  todoPage.addTask('My task'),
]);
const body = await request.postDataJSON();
expect(body).toMatchObject({ title: 'My task', completed: false });
```

This pattern:
- **Eliminates timing issues** — the request is captured regardless of how fast the browser sends it.
- **Is explicit** — the test documents that it cares about the outgoing network call.
- **Avoids arbitrary `setTimeout` waits**.

---

## 3. Test Project Organisation

### Structure

```
tests/
├── helpers/
│   └── api.mock.ts        # Network interception abstraction
├── pages/
│   └── todo.page.ts       # Page Object — single source of truth for locators
├── fixtures.ts            # Playwright custom fixtures (shared setup)
├── crud.spec.ts           # TC-01–10: CRUD operations and filtering
├── api-behavior.spec.ts   # TC-11–17: API contract and resilience
└── validation.spec.ts     # TC-18–23: input validation and edge cases
```

### Why split into three spec files?

Each file maps to a **distinct testing concern**:
- `crud.spec.ts` — does the UI behave correctly for happy-path user flows?
- `api-behavior.spec.ts` — does the app communicate correctly with the backend?
- `validation.spec.ts` — does the app reject invalid input and handle edge states?

This separation means that a failing CI run can pinpoint the affected area immediately (`api-behavior.spec.ts` fails → backend integration issue; `validation.spec.ts` fails → front-end validation regression).

### Fixtures instead of `beforeEach` + manual instantiation

Playwright fixtures (`test.extend`) were chosen over `beforeEach` blocks that manually create page objects because:
- The fixture is **injected by name**, making test dependencies explicit in the function signature.
- The fixture's teardown (implicit — Playwright handles page lifecycle) is automatic.
- Multiple fixtures (`apiMock`, `todoPage`) can be composed: `todoPage` depends on `apiMock`, so they share the same instance within a test.

```typescript
// Every test that uses `todoPage` gets a pre-navigated page with an empty task list.
test('TC-01', async ({ todoPage }) => {
  await todoPage.addTask('Buy milk');
  await expect(todoPage.taskLocator('Buy milk')).toBeVisible();
});
```

---

## 4. Maintainability Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Single responsibility** | `ApiMock` handles only routing; `TodoPage` handles only UI interactions; fixtures handle only setup/teardown. |
| **DRY** | Common setup (stub + navigate) lives in the `todoPage` fixture, not repeated in every test. |
| **Explicit assertions** | `expect(locator).toHaveCount(n)` with Playwright auto-retry instead of `resolves.toBe()` which has no retry. |
| **No magic selectors** | `taskLocator(title)` uses `.filter({ has })` — safe for any title string, no CSS injection risk. |
| **Fail-fast test IDs** | Every test is prefixed with `TC-XX` matching `TEST_CASES.md` for instant cross-reference. |
| **Typed interfaces** | `MockOptions` and `Task` interfaces in `api.mock.ts` prevent silent misuse at compile time. |

---

## 5. CI / CD Considerations

The `playwright.config.ts` is configured to:
- Run tests in **parallel** (`fullyParallel: true`) on developer machines.
- Use **single-worker** mode on CI (`workers: process.env.CI ? 1 : undefined`) to avoid resource contention.
- **Retry twice on CI** (`retries: process.env.CI ? 2 : 0`) to absorb transient flakiness.
- Generate an **HTML report** saved as a CI artefact for post-run inspection.
- Start the Angular dev server automatically via `webServer` configuration.

To add the suite to a GitHub Actions workflow:

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

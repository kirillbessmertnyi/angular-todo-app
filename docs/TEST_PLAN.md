# Test Plan — Angular ToDo App

## 1. Introduction

This document defines the test plan for the `angular-todo-app`, a single-page application built with Angular 16 that manages a to-do list backed by the public JSONPlaceholder REST API. The plan covers objectives, scope, test types, entry/exit criteria, risks, and effort estimates.

---

## 2. Objectives and Scope

**Objectives**
- Verify all user-facing CRUD features before release.
- Ensure the application behaves correctly when interacting with the external API, including handling of network delays and server errors.
- Provide a stable, maintainable E2E test suite using Playwright.

**In scope**
- Functional features: create, edit, delete, complete, and filter tasks.
- API interaction: POST, PUT, DELETE, and GET requests to JSONPlaceholder `/todos`.
- UI error handling when API responds with 5xx.
- Input validation: empty titles, whitespace-only input.
- Cross-browser coverage: Chromium, Firefox, WebKit (desktop).

**Out of scope**
- Unit tests for Angular components and services (assumed developer responsibility).
- Load or performance testing beyond single artificial request delays.
- Accessibility audit (WCAG compliance).
- Mobile-specific layout testing.

---

## 3. Test Types and Rationale

| Type | Tooling | Rationale |
|------|---------|-----------|
| **E2E (automated)** | Playwright | Cross-browser, real DOM interaction, built-in network interception |
| **Exploratory** | Manual | Discover unknown issues, exercise unusual flows |
| **Negative / boundary** | Playwright | Validate input constraints and edge states |
| **API contract** | Playwright `waitForRequest` / `waitForResponse` | Verify correct payloads are sent to the backend |
| **Regression** | CI pipeline (Playwright) | Prevent regressions on each pull request |

---

## 4. Test Environment

| Component | Version / Detail |
|-----------|-----------------|
| Angular | 16.2.x |
| Playwright | ^1.53 |
| Browsers | Chromium, Firefox, WebKit (via `playwright.config.ts`) |
| Backend | JSONPlaceholder (mocked in tests via `page.route()`) |
| Node.js | LTS (18+) |
| CI | Any GitHub Actions compatible runner |

---

## 5. Entry Criteria

- Application builds and serves successfully (`npm start`).
- Core CRUD features are implemented.
- `playwright.config.ts` is configured and all browsers can be installed.
- Smoke test (`npx playwright test --grep "TC-01"`) passes.

## 6. Exit Criteria

- All P0/P1 defects resolved or formally deferred with documented mitigation.
- Automated E2E suite passes on all three browsers in CI.
- Test case coverage meets the scope defined in `TEST_CASES.md`.
- Documentation (`TEST_PLAN.md`, `TEST_CASES.md`, `BUG_REPORTS.md`) reviewed and approved.

---

## 7. Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| External JSONPlaceholder API is unavailable or rate-limited | Medium | High | All tests stub the API with `page.route()` — no live network calls |
| API responses are not persisted between sessions | Certain | Medium | Tests are stateless; state is built per-test via mocks |
| Network delays cause test flakiness | Low | Medium | `page.waitForRequest/Response()` and explicit locator auto-waiting |
| Browser / OS differences break tests | Low | Medium | Suite runs on all three Playwright-managed browser engines |
| Angular selector changes break locators | Medium | High | Locators centralised in `TodoPage` POM; only one file to update |

---

## 8. Effort Estimate

| Activity | Estimate |
|----------|---------|
| Test planning & documentation | 1–2 days |
| Exploratory testing & bug reporting | 1 day |
| Playwright infrastructure (fixtures, POM, mock) | 1 day |
| Writing automated tests (46 cases) | 3 days |
| CI integration and verification | 0.5 day |
| Review & refinement buffer | 0.5 day |

_Total: approximately 7–8 person-days._

---

## 9. Test File Structure

```
tests/
├── helpers/
│   └── api.mock.ts        # ApiMock — centralised route stubbing
├── pages/
│   └── todo.page.ts       # Page Object for the ToDo UI
├── fixtures.ts            # Playwright custom fixtures
├── crud.spec.ts           # TC-01–TC-10, TC-24–TC-33: UI and filtering (20 tests)
├── api-behavior.spec.ts   # TC-11–TC-17, TC-34–TC-46: API contract & resilience (20 tests)
└── validation.spec.ts     # TC-18–TC-23: input validation & edge cases (6 tests)
```

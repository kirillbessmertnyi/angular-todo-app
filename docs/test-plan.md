# Test Plan for Angular ToDo App

## 1. Introduction
This document contains the test plan for the `angular-todo-app` used to manage a to-do list backed by the public JSONPlaceholder API. The plan covers the objectives, scope, test types, entry/exit criteria, risks, mitigation strategies, and estimated effort.

## 2. Objectives and Scope
- **Objectives:**
  - Verify all user-facing features of the to-do app before release.
  - Ensure the application behaves correctly when interacting with the external JSONPlaceholder API, including handling of delays and non-persistent data.
  - Provide a stable, maintainable E2E test suite using Playwright.

- **Scope:**
  - Functional features: create, edit, delete tasks, mark tasks completed, filter tasks.
  - API interaction: POST, PUT, DELETE requests to JSONPlaceholder.
  - UI responsiveness and error handling in face of API delays or failures.
  - Tests will cover desktop browsers (Chrome, Firefox, WebKit).

Out-of-scope:
  - Unit tests for Angular components (assumed covered by developers).
  - Load/performance testing beyond simple response delays.
  - Mobile-specific UI/UX (basic responsive check may be included but not exhaustive).

## 3. Test Types and Rationale
1. **Exploratory Testing** – initial investigation to discover unknown issues and generate bug reports.
2. **End-to-End (E2E) Testing** – automated tests using Playwright to cover main user flows; chosen for cross-browser coverage and ability to mock network conditions.
3. **Boundary/Negative Testing** – focus on invalid inputs, empty values, API errors; built into both exploratory and E2E test cases.
4. **API Contract Verification** – in tests, we will intercept network calls to validate request format and handle non-persistence.
5. **Regression Testing** – automated suite will run on each PR/CI to catch regressions.

## 4. Entry and Exit Criteria
- **Entry Criteria:**
  - Application builds and runs locally (`npm start`).
  - Essential CRUD features have been implemented.
  - Initial exploratory session completed and a baseline bug list created.
  - Playwright configuration is set up and smoke tests pass.

- **Exit Criteria:**
  - All priority P0/P1 defects addressed or deferred with appropriate mitigation.
  - The automated E2E suite passes reliably on at least Chrome.
  - Coverage of the core features meets the agreed test cases (see section 5).
  - Test documentation reviewed and approved by QA lead.

## 5. Risks and Mitigation
| Risk | Mitigation |
|------|------------|
| External API is unreliable or has rate limits | Intercept or mock network responses in tests; use Playwright routing to simulate API behavior. |
| API responses not persisted leads to inconsistent test state | Reset state per test by stubbing POST and keeping in-memory task list for assertions. |
| Network delays causing flakiness | Add retry logic and explicit waits; use Playwright's `waitForResponse` with timeouts. |
| Browser compatibility issues | Run automated tests across Chromium, Firefox, WebKit. |
| Developers change selectors | Use Page Object Pattern to centralize selectors and ease maintenance. |

## 6. Effort Estimate
- **Test planning & documentation:** 1-2 days
- **Exploratory testing and bug reporting:** 1 day
- **Playwright setup & page objects:** 1 day
- **Writing automated test cases (10–15):** 2 days
- **CI integration and verification:** 0.5 day
- **Buffer for fixes/refinement:** 1 day

_Total: approximately 6–7.5 person-days_.
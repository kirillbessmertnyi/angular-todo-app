# E2E Automation Guide for Angular ToDo App

This document describes how the end-to-end test project is organized, the patterns used, and the steps to execute tests.

## Project Structure
```
tests/
  pages/
    todo.page.ts      # Page object for the main UI
  todo.spec.ts        # Suite of Playwright tests covering key flows
playwright.config.ts  # Configuration for Playwright (browsers, servers)
```

### Page Object Pattern
We use the Page Object Model (POM) to encapsulate selectors and actions for the ToDo app. The class `TodoPage` (in `tests/pages/todo.page.ts`) exposes methods such as `addTask`, `editTask`, `deleteTask`, and `filter`.

Benefits:
- Reduces duplication across tests.
- Centralizes selector changes if the UI evolves.
- Improves readability of test scenarios.

Example usage in a test:
```ts
const todo = new TodoPage(page);
await todo.addTask('Buy milk');
await expect(todo.taskLocator('Buy milk')).toBeVisible();
```

## Handling Asynchronous API Behavior
The application interacts with an external JSONPlaceholder API which:
- Generates IDs on the server
- Does not persist changes
- May delay responses up to 2 seconds

To make tests reliable, we intercept network calls using Playwright's routing (`page.route`) and provide deterministic responses, optionally simulating delays or errors. The helper function `stubApi` in `tests/todo.spec.ts` configures these interceptions before each test, ensuring a clean state and predictable behaviour.

```ts
await stubApi(page, { delay: 2000 }); // simulate slow backend
await todo.addTask('Delayed task');
```

Tests also verify API contract details, such as confirming that a response includes an `id` field.

## Running Tests
1. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```
2. Start the Angular application (automatically done by Playwright if not running):
   ```bash
   npm run start
   ```
3. Run the E2E suite:
   ```bash
   npm run test:e2e
   ```
4. To view an interactive report:
   ```bash
   npm run test:e2e:report
   ```

On CI, tests run with `--headed` disabled and retry logic enabled. The `playwright.config.ts` file is set up to start a local server on port 4200 before tests begin.

## Organizing Future Tests
- Additional page objects can be added under `tests/pages` for new screens.
- Common fixtures and utilities should be placed in `tests/utils` or similar.
- Keep tests focused on user-level scenarios rather than implementation details.

This structure makes it easy for developers and QA engineers to extend the suite as functionality expands.

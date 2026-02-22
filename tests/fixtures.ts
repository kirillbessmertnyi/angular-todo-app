import { test as base, expect } from '@playwright/test';
import { TodoPage } from './pages/todo.page';
import { ApiMock } from './helpers/api.mock';

/**
 * Custom fixture types available to all test files.
 *
 * - `apiMock`  – a pre-constructed ApiMock instance. Call `apiMock.setup()`
 *               in a test to install (or override) route handlers for the
 *               /todos API.
 *
 * - `todoPage` – a TodoPage POM instance. The fixture automatically installs
 *               a default stub (empty task list) and navigates to the app root
 *               before yielding the object. Tests that need a different initial
 *               state should call `apiMock.setup({ initialTasks: [...] })` and
 *               then `await todoPage.goto()` at the start of the test body.
 */
type Fixtures = {
  apiMock: ApiMock;
  todoPage: TodoPage;
};

export const test = base.extend<Fixtures>({
  apiMock: async ({ page }, use) => {
    const mock = new ApiMock(page);
    await use(mock);
  },

  todoPage: async ({ page, apiMock }, use) => {
    // Default API state: no pre-existing tasks, instant responses, no errors.
    await apiMock.setup({ initialTasks: [] });
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
  },
});

// Re-export expect so spec files can import everything from one place.
export { expect } from '@playwright/test';

/**
 * API behaviour test suite — verifies interactions with the /todos API.
 *
 * Tests cover:
 *   - Initial data load from the API.
 *   - Correct request payloads for POST / PUT / DELETE.
 *   - Resilience to delayed or failing API responses.
 *
 * Network requests are intercepted using ApiMock (route-level stubbing) and
 * `page.waitForRequest()` / `page.waitForResponse()` for assertions that need
 * to inspect the actual request before it is fulfilled.
 */
import { test, expect } from './fixtures';
import { TodoPage } from './pages/todo.page';

test.describe('Initial data load', () => {
  /**
   * This test does NOT use the `todoPage` fixture because it needs to register
   * routes BEFORE navigating — the fixture already navigates with an empty list.
   * Using raw `page` + `apiMock` fixtures gives full control over setup order.
   */
  test('TC-11 should display tasks returned by the API on page load', async ({
    page,
    apiMock,
  }) => {
    await apiMock.setup({
      initialTasks: [
        { id: 1, title: 'Preloaded task', completed: false, userId: 1 },
        { id: 2, title: 'Another preloaded', completed: true, userId: 1 },
      ],
    });

    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await expect(todoPage.taskLocator('Preloaded task')).toBeVisible();
    await expect(todoPage.taskLocator('Another preloaded')).toBeVisible();
    await expect(todoPage.taskList).toHaveCount(2);
  });
});

test.describe('Request payload validation', () => {
  /**
   * `page.waitForRequest()` is used instead of an `onPost` callback because it
   * pairs the action and the network assertion atomically via `Promise.all`,
   * guaranteeing the request is captured regardless of timing.
   */
  test('TC-12 should POST the correct payload when creating a task', async ({
    page,
    todoPage,
  }) => {
    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos') && req.method() === 'POST',
      ),
      todoPage.addTask('My new task'),
    ]);

    const body = await request.postDataJSON();
    expect(body).toMatchObject({
      title: 'My new task',
      completed: false,
    });
  });

  test('TC-13 should PUT the updated title when editing a task', async ({
    page,
    todoPage,
  }) => {
    await todoPage.addTask('Original');

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'PUT',
      ),
      todoPage.editTask('Original', 'Edited'),
    ]);

    const body = await request.postDataJSON();
    expect(body).toMatchObject({ title: 'Edited' });
  });

  test('TC-14 should send a DELETE request to the correct /todos/:id endpoint', async ({
    page,
    todoPage,
  }) => {
    await todoPage.addTask('To be deleted');

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'DELETE',
      ),
      todoPage.deleteTask('To be deleted'),
    ]);

    expect(request.url()).toMatch(/\/todos\/\d+$/);
  });

  test('TC-15 should receive an id in the API response after creating a task', async ({
    page,
    todoPage,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/todos') && res.request().method() === 'POST',
      ),
      todoPage.addTask('With ID'),
    ]);

    const body = await response.json();
    expect(typeof body.id).toBe('number');
    expect(body.id).toBeGreaterThan(0);
  });
});

test.describe('Resilience to adverse network conditions', () => {
  test('TC-16 should display the task after a delayed API response', async ({
    todoPage,
    apiMock,
  }) => {
    // Re-setup routes with a 2-second POST delay.
    await apiMock.setup({ delay: 2000 });

    await todoPage.addTask('Delayed task');

    // Allow up to 5 s for the task to appear after the artificial delay.
    await expect(todoPage.taskLocator('Delayed task')).toBeVisible({ timeout: 5000 });
  });

  test('TC-17 should show an error message when the API returns a 500', async ({
    todoPage,
    apiMock,
  }) => {
    await apiMock.setup({ error: true });

    await todoPage.addTask('Failing task');

    await expect(todoPage.errorMessage).toContainText(/failed/i);
  });
});

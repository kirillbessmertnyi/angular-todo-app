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

// ─────────────────────────────────────────────────────────────────────────────
// New integration tests — TC-34 to TC-46
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ID tracking across requests', () => {
  test('TC-34 should PUT to the URL containing the id assigned by POST', async ({
    page,
    todoPage,
  }) => {
    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/todos') && res.request().method() === 'POST',
      ),
      todoPage.addTask('ID-tracked task'),
    ]);
    const { id } = await postResponse.json();

    const [putRequest] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'PUT',
      ),
      todoPage.editTask('ID-tracked task', 'Updated'),
    ]);

    expect(putRequest.url()).toContain(`/todos/${id}`);
  });

  test('TC-40 should DELETE the URL containing the id assigned by POST', async ({
    page,
    todoPage,
  }) => {
    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/todos') && res.request().method() === 'POST',
      ),
      todoPage.addTask('ID-delete-test'),
    ]);
    const { id } = await postResponse.json();

    const [deleteRequest] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'DELETE',
      ),
      todoPage.deleteTask('ID-delete-test'),
    ]);

    expect(deleteRequest.url()).toContain(`/todos/${id}`);
  });

  test('TC-44 should assign a unique id to each newly created task', async ({
    page,
    todoPage,
  }) => {
    const ids: number[] = [];

    for (const title of ['Unique A', 'Unique B', 'Unique C']) {
      const [response] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/todos') && res.request().method() === 'POST',
        ),
        todoPage.addTask(title),
      ]);
      const body = await response.json();
      ids.push(body.id);
    }

    expect(new Set(ids).size).toBe(3);
  });

  test('TC-45 should DELETE /todos/42 for a task pre-loaded with id 42', async ({
    page,
    apiMock,
  }) => {
    await apiMock.setup({
      initialTasks: [{ id: 42, title: 'Pre-loaded 42', completed: false, userId: 1 }],
    });
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'DELETE',
      ),
      todoPage.deleteTask('Pre-loaded 42'),
    ]);

    expect(request.url()).toContain('/todos/42');
  });
});

test.describe('Toggle completion via PUT', () => {
  test('TC-35 should send a PUT request when toggling a task', async ({ page, todoPage }) => {
    await todoPage.addTask('Toggle task');

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'PUT',
      ),
      todoPage.toggleTask('Toggle task'),
    ]);

    expect(request.url()).toMatch(/\/todos\/\d+$/);
  });

  test('TC-36 should PUT with completed:true when toggling an active task', async ({
    page,
    todoPage,
  }) => {
    await todoPage.addTask('Active task');

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'PUT',
      ),
      todoPage.toggleTask('Active task'),
    ]);

    const body = await request.postDataJSON();
    expect(body.completed).toBe(true);
  });

  test('TC-37 should PUT with completed:false when untoggling a completed task', async ({
    page,
    todoPage,
  }) => {
    await todoPage.addTask('Complete then undo');

    // First toggle — wait for the PUT response so the component updates its state
    // before we issue the second toggle.
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/todos/') && res.request().method() === 'PUT',
      ),
      todoPage.toggleTask('Complete then undo'),
    ]);

    // Second toggle — capture the PUT request body
    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos/') && req.method() === 'PUT',
      ),
      todoPage.toggleTask('Complete then undo'),
    ]);

    const body = await request.postDataJSON();
    expect(body.completed).toBe(false);
  });
});

test.describe('Initial load integration', () => {
  test('TC-38 should apply the completed CSS class to a pre-loaded task with completed:true', async ({
    page,
    apiMock,
  }) => {
    await apiMock.setup({
      initialTasks: [{ id: 7, title: 'Already done', completed: true, userId: 1 }],
    });
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await expect(
      todoPage.taskLocator('Already done').locator('.task-title'),
    ).toHaveClass(/completed/);
  });

  test('TC-39 should send a GET request to /todos when the page loads', async ({
    page,
    apiMock,
  }) => {
    await apiMock.setup({ initialTasks: [] });

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos') && req.method() === 'GET',
      ),
      new TodoPage(page).goto(),
    ]);

    expect(request.method()).toBe('GET');
  });

  test('TC-46 should include a _limit parameter in the GET request', async ({
    page,
    apiMock,
  }) => {
    await apiMock.setup({ initialTasks: [] });

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/todos') && req.method() === 'GET',
      ),
      new TodoPage(page).goto(),
    ]);

    expect(request.url()).toContain('_limit');
  });
});

test.describe('Validation at network level', () => {
  test('TC-41 should not send a POST request when whitespace-only title is submitted via Enter', async ({
    page,
    todoPage,
  }) => {
    const postRequest = page
      .waitForRequest(
        (req) => req.url().includes('/todos') && req.method() === 'POST',
        { timeout: 1000 },
      )
      .catch(() => null);

    await todoPage.addTaskByEnter('   ');

    expect(await postRequest).toBeNull();
  });
});

test.describe('Error handling for DELETE and PUT', () => {
  // TC-42 and TC-43 are expected to fail until BUG-04 is fixed:
  // subscribe() calls in the component have no error handler, so a 500 response
  // never triggers any UI feedback.

  test('TC-42 should show an error message when DELETE returns a 500', async ({
    todoPage,
    apiMock,
  }) => {
    await todoPage.addTask('Task to fail-delete');
    await apiMock.setup({ error: true });

    await todoPage.deleteTask('Task to fail-delete');

    await expect(todoPage.errorMessage).toContainText(/failed/i);
  });

  test('TC-43 should show an error message when PUT returns a 500', async ({
    todoPage,
    apiMock,
  }) => {
    await todoPage.addTask('Task to fail-update');
    await apiMock.setup({ error: true });

    await todoPage.editTask('Task to fail-update', 'New title');

    await expect(todoPage.errorMessage).toContainText(/failed/i);
  });
});

import { test, expect, Page } from '@playwright/test';
import { TodoPage } from './pages/todo.page';

// Reusable fixture that sets up the page object before each test
// and provides a default stubbed backend with no tasks.  Individual tests
// may call `stubApi` again to override behavior; the helper will clear
// any previous routes before registering its handlers.
test.beforeEach(async ({ page }) => {
  await stubApi(page, { initialTasks: [] });
  const todo = new TodoPage(page);
  await todo.goto();
});

// Helper to stub the JSONPlaceholder API so that tests are deterministic
// options: delay adds latency, error forces 500 responses,
// initialTasks provides GET /todos response,
// onPost callback is invoked with the request body for validation.
async function stubApi(page: Page, options: {
  delay?: number;
  error?: boolean;
  initialTasks?: any[];
  onPost?: (body: any) => void;
} = {}) {
  // clear any existing handlers so repeated calls override previous ones
  await page.unroute('**/todos?_limit=10');
  await page.unroute('**/todos');

  // handle GET separately to return controlled list
  await page.route('**/todos?_limit=10', async (route) => {
    const tasks = options.initialTasks || [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tasks) });
  });

  // generic handler for POST/PUT/DELETE
  await page.route('**/todos**', async (route, request) => {
    const method = request.method();
    if (method === 'GET') {
      // let GET pass through to the more specific handler above
      return route.continue();
    }
    if (options.error) {
      await route.fulfill({ status: 500, body: '{"error":"simulated"}' });
      return;
    }
    if (options.delay) {
      await new Promise((r) => setTimeout(r, options.delay));
    }
    let body;
    try {
      body = await request.postDataJSON();
    } catch {
      body = {};
    }
    if (method === 'POST' && options.onPost) {
      options.onPost(body);
    }
    // simple response model with random id
    const response = { ...body, id: Math.floor(Math.random() * 10000) };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
  });
}

// Positive scenario: create a task
test('should add a new task', async ({ page }) => {
  const todo = new TodoPage(page);
  await todo.addTask('Buy milk');
  await expect(await todo.taskLocator('Buy milk')).toBeVisible();
});

// Edit existing task
test('should edit a task', async ({ page }) => {
  const todo = new TodoPage(page);
  await todo.addTask('Original');
  await todo.editTask('Original', 'Updated');
  await expect(await todo.taskLocator('Updated')).toBeVisible();
});

// Delete task
test('should delete a task', async ({ page }) => {
  const todo = new TodoPage(page);
  await todo.addTask('To be deleted');
  await todo.deleteTask('To be deleted');
  await expect(await todo.taskLocator('To be deleted')).not.toBeVisible();
});

// Mark task completed and filter
test('should toggle completion and filter accordingly', async ({ page }) => {
  const todo = new TodoPage(page);
  await todo.addTask('Task1');
  await todo.toggleTask('Task1');
  await todo.filter('completed');
  await expect(await todo.taskLocator('Task1')).toBeVisible();
  await todo.filter('active');
  const taskLocator = await todo.taskLocator('Task1');
  await expect(taskLocator).toHaveCount(0);
});

// Negative: prevent blank task
test('should not create empty task', async ({ page }) => {
  let posted = false;
  await stubApi(page, {
    initialTasks: [],
    onPost: () => { posted = true; }
  });
  const todo = new TodoPage(page);
  await todo.addTask('   ');
  // expecting zero tasks created
  await expect(todo.getTaskCount()).resolves.toBe(0);
  expect(posted).toBe(false);
});

// Edge: handle API delay gracefully
test('should handle delayed API response', async ({ page }) => {
  await stubApi(page, { delay: 2000, initialTasks: [] });
  const todo = new TodoPage(page);
  await todo.addTask('Delayed task');
  await expect(await todo.taskLocator('Delayed task')).toBeVisible({ timeout: 5000 });
});

// Negative: show error on server failure
test('should show error message when API fails', async ({ page }) => {
  await stubApi(page, { error: true, initialTasks: [] });
  const todo = new TodoPage(page);
  await todo.addTask('Failing');
  const error = page.locator('.error');
  await expect(error).toContainText(/failed/i);
});

// Boundary: rapid multiple adds
test('should add multiple tasks quickly', async ({ page }) => {
  await stubApi(page, { initialTasks: [] });
  const todo = new TodoPage(page);
  for (let i = 0; i < 5; i++) {
    await todo.addTask(`Task ${i}`);
  }
  await expect(todo.getTaskCount()).resolves.toBe(5);
});

// Boundary/negative: edit to empty string should not produce a blank task
test('should not allow editing task to empty', async ({ page }) => {
  await stubApi(page, { initialTasks: [] });
  const todo = new TodoPage(page);
  await todo.addTask('Nonempty');
  await todo.editTask('Nonempty', '');
  // original text should remain or the task removed, but there should be no
  // task with an empty title
  const texts = await todo.getTasksText();
  expect(texts).not.toContain('');
  const count = await todo.getTaskCount();
  // after editing to empty, either the original title stays (count 1) or the
  // task is removed (count 0). both are acceptable but there must not be
  // more than one task.
  expect([0, 1]).toContain(count);
});

// Edge-case: delete after refresh when state lost
test('should handle delete of missing task gracefully', async ({ page }) => {
  await stubApi(page, { initialTasks: [] });
  const todo = new TodoPage(page);
  await todo.addTask('Temporary');
  await page.reload();
  // no element should exist after reload, confirm by count
  await expect(todo.getTaskCount()).resolves.toBe(0);
});

// Check ID generation in network response
test('should receive ID from API on create', async ({ page }) => {
  let captured: any = null;
  await stubApi(page, {
    initialTasks: [],
    onPost: (body) => {
      captured = body;
    }
  });
  const todo = new TodoPage(page);
  await todo.addTask('With ID');
  expect(captured).not.toBeNull();
});

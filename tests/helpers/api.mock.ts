import { Page } from '@playwright/test';

export interface Task {
  id?: number;
  title: string;
  completed: boolean;
  userId?: number;
}

export interface MockOptions {
  /** Tasks returned by GET /todos?_limit=10. Defaults to []. */
  initialTasks?: Task[];
  /** Artificial delay in milliseconds applied to mutating requests (POST/PUT/DELETE). */
  delay?: number;
  /** When true, all mutating requests return HTTP 500. */
  error?: boolean;
  /** Called with the request body when a POST /todos request is intercepted. */
  onPost?: (body: Task) => void;
  /** Called with the request body and task id when a PUT /todos/:id request is intercepted. */
  onPut?: (body: Task, id: string) => void;
  /** Called with the task id when a DELETE /todos/:id request is intercepted. */
  onDelete?: (id: string) => void;
}

/**
 * ApiMock centralizes all Playwright route interceptions for the JSONPlaceholder
 * /todos API. Call `setup()` before navigating (or before the action under test)
 * to install deterministic, in-memory route handlers. Calling `setup()` again
 * automatically removes previous handlers, so individual tests can override
 * the default behaviour without manual cleanup.
 */
export class ApiMock {
  private readonly page: Page;
  private static readonly ROUTE_PATTERN = '**/todos**';

  constructor(page: Page) {
    this.page = page;
  }

  async setup(options: MockOptions = {}): Promise<void> {
    // Remove previously registered handlers before registering new ones.
    await this.page.unroute(ApiMock.ROUTE_PATTERN);

    await this.page.route(ApiMock.ROUTE_PATTERN, async (route, request) => {
      const url = new URL(request.url());
      const method = request.method();
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];

      // Detect routes like /todos/123 (with numeric ID in path).
      const hasIdInPath = lastSegment !== 'todos' && !isNaN(Number(lastSegment));

      // ── GET /todos?_limit=10 ─────────────────────────────────────────────
      if (method === 'GET') {
        const tasks = options.initialTasks ?? [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(tasks),
        });
        return;
      }

      // ── Simulated server error ───────────────────────────────────────────
      if (options.error) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'simulated server error' }),
        });
        return;
      }

      // ── Optional artificial latency ──────────────────────────────────────
      if (options.delay) {
        await new Promise<void>((resolve) => setTimeout(resolve, options.delay));
      }

      // ── DELETE /todos/:id ────────────────────────────────────────────────
      if (method === 'DELETE' && hasIdInPath) {
        options.onDelete?.(lastSegment);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        });
        return;
      }

      // Parse body for POST / PUT
      let body: Task = { title: '', completed: false };
      try {
        body = (await request.postDataJSON()) as Task;
      } catch {
        // non-JSON bodies are treated as empty
      }

      // ── PUT /todos/:id ───────────────────────────────────────────────────
      if (method === 'PUT' && hasIdInPath) {
        options.onPut?.(body, lastSegment);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...body, id: Number(lastSegment) }),
        });
        return;
      }

      // ── POST /todos ──────────────────────────────────────────────────────
      if (method === 'POST') {
        options.onPost?.(body);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...body, id: Math.floor(Math.random() * 10_000) + 1 }),
        });
        return;
      }

      await route.continue();
    });
  }
}

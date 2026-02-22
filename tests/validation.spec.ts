/**
 * Validation and edge-case test suite.
 *
 * Tests cover:
 *   - Input sanitisation (empty / whitespace-only titles).
 *   - Boundary behaviour (rapid task creation, empty-edit).
 *   - State consistency after page reload (API non-persistence contract).
 */
import { test, expect } from './fixtures';

test.describe('Input validation', () => {
  test('TC-18 should not create a task when the input is empty', async ({ todoPage }) => {
    await todoPage.addTask('');

    await expect(todoPage.taskList).toHaveCount(0);
  });

  test('TC-19 should not create a task when the input contains only whitespace', async ({
    todoPage,
  }) => {
    await todoPage.addTask('   ');

    await expect(todoPage.taskList).toHaveCount(0);
  });

  test('TC-20 should not send a POST request when input is empty', async ({
    page,
    todoPage,
  }) => {
    // Wait for a POST with a 1-second timeout; if none arrives, the promise
    // rejects and we treat that as the expected "no request sent" outcome.
    const postRequest = page
      .waitForRequest(
        (req) => req.url().includes('/todos') && req.method() === 'POST',
        { timeout: 1000 },
      )
      .catch(() => null);

    await todoPage.addTask('');

    expect(await postRequest).toBeNull();
  });

  test('TC-21 should not allow editing a task title to an empty string', async ({
    todoPage,
  }) => {
    await todoPage.addTask('Nonempty task');
    await todoPage.editTask('Nonempty task', '');

    const texts = await todoPage.getTasksText();
    expect(texts).not.toContain('');

    // The app may either preserve the original title or remove the task entirely.
    // Either outcome is acceptable — what must not happen is a blank entry.
    const count = await todoPage.getTaskCount();
    expect([0, 1]).toContain(count);
  });
});

test.describe('Boundary conditions', () => {
  test('TC-22 should add five tasks in rapid succession without losing any', async ({
    todoPage,
  }) => {
    for (let i = 1; i <= 5; i++) {
      await todoPage.addTask(`Rapid task ${i}`);
    }

    await expect(todoPage.taskList).toHaveCount(5);
  });

  test('TC-23 should show an empty list after a page reload (API non-persistence)', async ({
    page,
    todoPage,
  }) => {
    await todoPage.addTask('Temporary task');
    await expect(todoPage.taskList).toHaveCount(1);

    // The mock GET handler always returns [] so a reload yields an empty list,
    // confirming the app does not rely on local state surviving navigation.
    await page.reload();
    await expect(todoPage.taskList).toHaveCount(0);
  });
});

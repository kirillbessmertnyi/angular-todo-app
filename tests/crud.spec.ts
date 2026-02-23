/**
 * CRUD test suite — covers the core task management flows.
 *
 * All tests use the `todoPage` fixture which:
 *   1. Stubs the /todos API with an empty task list.
 *   2. Navigates to the app root.
 *   3. Yields a ready-to-use TodoPage POM instance.
 */
import { test, expect } from './fixtures';

test.describe('Task creation', () => {
  test('TC-01 should add a new task via the Add button', async ({ todoPage }) => {
    await todoPage.addTask('Buy milk');

    await expect(todoPage.taskLocator('Buy milk')).toBeVisible();
  });

  test('TC-02 should add a new task by pressing Enter', async ({ todoPage }) => {
    await todoPage.addTaskByEnter('Press Enter task');

    await expect(todoPage.taskLocator('Press Enter task')).toBeVisible();
  });

  test('TC-03 should clear the input field after adding a task', async ({ todoPage }) => {
    await todoPage.addTask('Clearing check');

    await expect(todoPage.newTaskInput).toHaveValue('');
  });
});

test.describe('Task editing', () => {
  test('TC-04 should update a task title on save', async ({ todoPage }) => {
    await todoPage.addTask('Original title');
    await todoPage.editTask('Original title', 'Updated title');

    await expect(todoPage.taskLocator('Updated title')).toBeVisible();
    await expect(todoPage.taskLocator('Original title')).not.toBeVisible();
  });
});

test.describe('Task deletion', () => {
  test('TC-05 should remove a task from the list', async ({ todoPage }) => {
    await todoPage.addTask('Task to delete');
    await todoPage.deleteTask('Task to delete');

    await expect(todoPage.taskLocator('Task to delete')).not.toBeVisible();
    await expect(todoPage.taskList).toHaveCount(0);
  });
});

test.describe('Task completion toggle', () => {
  test('TC-06 should mark a task as completed', async ({ todoPage }) => {
    await todoPage.addTask('Toggle me');
    await todoPage.toggleTask('Toggle me');

    // The app applies a CSS class "completed" to the title span.
    await expect(
      todoPage.taskLocator('Toggle me').locator('.task-title'),
    ).toHaveClass(/completed/);
  });

  test('TC-07 should unmark a completed task', async ({ todoPage }) => {
    await todoPage.addTask('Unmark me');
    await todoPage.toggleTask('Unmark me');
    await todoPage.toggleTask('Unmark me');

    await expect(
      todoPage.taskLocator('Unmark me').locator('.task-title'),
    ).not.toHaveClass(/completed/);
  });
});

test.describe('Filtering', () => {
  test('TC-08 should show only completed tasks when Completed filter is active', async ({
    todoPage,
  }) => {
    await todoPage.addTask('Active task');
    await todoPage.addTask('Done task');
    await todoPage.toggleTask('Done task');

    await todoPage.filter('completed');

    await expect(todoPage.taskLocator('Done task')).toBeVisible();
    await expect(todoPage.taskLocator('Active task')).not.toBeVisible();
  });

  test('TC-09 should show only active tasks when Active filter is active', async ({
    todoPage,
  }) => {
    await todoPage.addTask('Active task');
    await todoPage.addTask('Done task');
    await todoPage.toggleTask('Done task');

    await todoPage.filter('active');

    await expect(todoPage.taskLocator('Active task')).toBeVisible();
    await expect(todoPage.taskLocator('Done task')).not.toBeVisible();
  });

  test('TC-10 should show all tasks when All filter is selected', async ({ todoPage }) => {
    await todoPage.addTask('Active task');
    await todoPage.addTask('Done task');
    await todoPage.toggleTask('Done task');

    await todoPage.filter('completed');
    await todoPage.filter('all');

    await expect(todoPage.taskList).toHaveCount(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// New UI tests — TC-24 to TC-33
// ─────────────────────────────────────────────────────────────────────────────

test.describe('List order', () => {
  test('TC-24 should prepend a new task to the top of the list', async ({ todoPage }) => {
    await todoPage.addTask('First');
    await todoPage.addTask('Second');

    const texts = await todoPage.getTasksText();
    expect(texts[0]).toBe('Second');
    expect(texts[1]).toBe('First');
  });

  test('TC-25 should display tasks in reverse-creation order', async ({ todoPage }) => {
    await todoPage.addTask('Task A');
    await todoPage.addTask('Task B');
    await todoPage.addTask('Task C');

    // Wait for all three tasks to be rendered before reading their order.
    await expect(todoPage.taskList).toHaveCount(3);
    const texts = await todoPage.getTasksText();
    expect(texts).toEqual(['Task C', 'Task B', 'Task A']);
  });
});

test.describe('Edit mode UI', () => {
  test('TC-26 should not show the edit input before Edit is clicked', async ({ todoPage }) => {
    await todoPage.addTask('Regular task');

    await expect(todoPage.page.locator('.edit-input')).not.toBeVisible();
  });
});

test.describe('Task checkbox state', () => {
  test('TC-27 should display the checkbox as checked for a completed task', async ({
    todoPage,
  }) => {
    await todoPage.addTask('Check me');
    await todoPage.toggleTask('Check me');

    await expect(
      todoPage.taskLocator('Check me').locator('.task-checkbox'),
    ).toBeChecked();
  });
});

test.describe('Task isolation', () => {
  test('TC-28 should only remove the targeted task without affecting others', async ({
    todoPage,
  }) => {
    await todoPage.addTask('Keep A');
    await todoPage.addTask('Delete me');
    await todoPage.addTask('Keep B');

    await todoPage.deleteTask('Delete me');

    await expect(todoPage.taskLocator('Keep A')).toBeVisible();
    await expect(todoPage.taskLocator('Keep B')).toBeVisible();
    await expect(todoPage.taskList).toHaveCount(2);
  });
});

test.describe('Filter UI', () => {
  test('TC-29 should display all three filter buttons', async ({ todoPage }) => {
    await expect(todoPage.filters.all).toBeVisible();
    await expect(todoPage.filters.active).toBeVisible();
    await expect(todoPage.filters.completed).toBeVisible();
  });

  test('TC-30 should keep the same task count after cycling through all filters', async ({
    todoPage,
  }) => {
    await todoPage.addTask('Task 1');
    await todoPage.addTask('Task 2');
    await todoPage.addTask('Task 3');

    await todoPage.filter('active');
    await todoPage.filter('completed');
    await todoPage.filter('all');

    await expect(todoPage.taskList).toHaveCount(3);
  });

  test('TC-31 should remain stable after clicking the same filter multiple times', async ({
    todoPage,
  }) => {
    await todoPage.addTask('Stable task');

    await todoPage.filter('active');
    await todoPage.filter('active');
    await todoPage.filter('active');

    await expect(todoPage.taskLocator('Stable task')).toBeVisible();
    await expect(todoPage.taskList).toHaveCount(1);
  });
});

test.describe('Special content', () => {
  test('TC-32 should display a task title containing special HTML characters', async ({
    todoPage,
  }) => {
    const title = 'Buy <milk> & "eggs"';
    await todoPage.addTask(title);

    await expect(todoPage.taskLocator(title)).toBeVisible();
  });
});

test.describe('Task controls', () => {
  test('TC-33 should show Edit and Delete buttons on every task item', async ({ todoPage }) => {
    await todoPage.addTask('Task Alpha');
    await todoPage.addTask('Task Beta');

    for (const title of ['Task Alpha', 'Task Beta']) {
      await expect(todoPage.taskLocator(title).locator('.edit-button')).toBeVisible();
      await expect(todoPage.taskLocator(title).locator('.delete-button')).toBeVisible();
    }
  });
});

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

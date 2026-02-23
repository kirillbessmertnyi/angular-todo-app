import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Angular ToDo application.
 *
 * All element locators and user-level actions are defined here.
 * When the UI structure changes only this file needs to be updated —
 * tests remain untouched.
 *
 * Design notes:
 * - Locators are declared as readonly properties in the constructor so they
 *   are created once and reused. Playwright Locators are lazy by design; no
 *   network/DOM interaction happens until an action or assertion is triggered.
 * - `taskLocator()` uses `.filter({ has: ... })` instead of CSS string
 *   interpolation, which is safe against titles that contain quotes or
 *   special characters.
 * - Action methods are `async` and return `Promise<void>` so callers can
 *   always `await` them without confusion.
 */
export class TodoPage {
  readonly page: Page;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  /** Locator for every task row in the list. Useful for `toHaveCount()`. */
  readonly taskList: Locator;
  /** Locator for the error banner rendered by the app on API failure. */
  readonly errorMessage: Locator;
  readonly filters: {
    all: Locator;
    active: Locator;
    completed: Locator;
  };

  constructor(page: Page) {
    this.page = page;
    this.newTaskInput = page.locator('input.task-input');
    this.addButton = page.locator('button.add-button');
    this.taskList = page.locator('.task-list .task-item');
    this.errorMessage = page.locator('.error');
    this.filters = {
      all: page.getByRole('button', { name: 'All' }),
      active: page.getByRole('button', { name: 'Active' }),
      completed: page.getByRole('button', { name: 'Completed' }),
    };
  }

  /** Navigate to the app root and wait until Angular has bootstrapped. */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.locator('app-root').waitFor();
  }

  /**
   * Returns a Locator scoped to the task row that contains `title`.
   * Using `.filter({ has })` avoids brittle string interpolation and is safe
   * for titles that include quotes, parentheses, or CSS meta-characters.
   */
  taskLocator(title: string): Locator {
    return this.taskList.filter({
      has: this.page.locator('.task-title', { hasText: title }),
    });
  }

  /** Fill the input and submit via the Add button. */
  async addTask(title: string): Promise<void> {
    await this.newTaskInput.fill(title);
    await this.addButton.click();
  }

  /** Fill the input and submit via the Enter key. */
  async addTaskByEnter(title: string): Promise<void> {
    await this.newTaskInput.fill(title);
    await this.newTaskInput.press('Enter');
  }

  async editTask(oldTitle: string, newTitle: string): Promise<void> {
    await this.taskLocator(oldTitle).locator('.edit-button').click();
    await this.page.locator('.edit-input').fill(newTitle);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async deleteTask(title: string): Promise<void> {
    await this.taskLocator(title).locator('.delete-button').click();
  }

  async toggleTask(title: string): Promise<void> {
    await this.taskLocator(title).locator('.task-checkbox').click();
  }

  async filter(type: 'all' | 'active' | 'completed'): Promise<void> {
    await this.filters[type].click();
  }

  async getTaskCount(): Promise<number> {
    return this.taskList.count();
  }

  async getTasksText(): Promise<string[]> {
    const texts = await this.page.locator('.task-list .task-item .task-title').allTextContents();
    return texts.map((t) => t.trim());
  }
}

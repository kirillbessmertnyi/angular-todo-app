import { Page, Locator } from '@playwright/test';

// Page Object Model for the main ToDo application page.
// This class centralizes selectors and actions, making tests easier
// to read and maintain. When UI selectors change, only this file
// usually needs updating.
export class TodoPage {
  readonly page: Page;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  readonly taskList: Locator;
  readonly filters: { all: Locator; active: Locator; completed: Locator };

  constructor(page: Page) {
    this.page = page;
    // selectors based on the provided HTML structure
    this.newTaskInput = page.locator('input.task-input');
    this.addButton = page.locator('button.add-button');
    this.taskList = page.locator('.task-list .task-item');
    this.filters = {
      all: page.getByRole('button', { name: 'All' }),
      active: page.getByRole('button', { name: 'Active' }),
      completed: page.getByRole('button', { name: 'Completed' }),
    };
  }

  async goto() {
    await this.page.goto('/');
  }

  async addTask(title: string) {
    await this.newTaskInput.fill(title);
    // click the visible Add button to match typical user action
    await this.addButton.click();
  }

  async taskLocator(title: string) {
    // return the task-item that contains the exact title text inside .task-title
    return this.page.locator(`.task-item:has(.task-title:has-text("${title}"))`);
  }

  async editTask(oldTitle: string, newTitle: string) {
    const task = await this.taskLocator(oldTitle);
    const editButton = task.locator('.edit-button');
    await editButton.click();
    const editInput = this.page.locator('.edit-input');
    await editInput.fill(newTitle);
    const saveButton = this.page.getByRole('button', { name: 'Save' });
    await saveButton.click();
  }

  async deleteTask(title: string) {
    const task = await this.taskLocator(title);
    const deleteButton = task.locator('.delete-button');
    await deleteButton.click();
  }

  async toggleTask(title: string) {
    const task = await this.taskLocator(title);
    const checkbox = task.locator('.task-checkbox');
    await checkbox.click();
  }

  async filter(type: 'all' | 'active' | 'completed') {
    await this.filters[type].click();
  }

  async getTaskCount() {
    return await this.taskList.count();
  }

  async getTasksText() {
    // return only the visible title texts for each task to avoid including
    // button labels or other controls in the returned strings.
    return await this.page.locator('.task-list .task-item .task-title').allTextContents();
  }

  // additional helper to intercept API calls, e.g. to stub
  async intercept(route: string, handler: (route: any, request: any) => Promise<void>) {
    await this.page.route(route, handler);
  }
}

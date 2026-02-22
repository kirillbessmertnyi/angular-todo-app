# Bug Reports — Angular ToDo App

Defects discovered during exploratory testing, test-code review, and automated Allure test-run analysis.

---

## Last Test Run Summary

**Run date:** 2026-02-22 · **Tool:** Playwright + allure-playwright · **Browsers:** Chromium, Firefox, WebKit

| Status | Unique tests | Total results (×3 browsers) |
|--------|-------------|----------------------------|
| ✅ Passed | 21 | 63 |
| ❌ Failed | 2 | 6 |
| Total | 23 | 69 |

**2 tests failing across all 3 browsers — details in BUG-07 and updated BUG-04 below.**

---

## Application Bugs

### BUG-01 — Task disappears after editing when server responds slowly

- **Status:** Open
- **Automated coverage:** None (not yet reproduced in CI with mocked delay)
- **Environment:** Chrome, artificial 2-second PUT delay
- **Steps:**
  1. Create task "Read book".
  2. Stub PUT to delay response by 2 000 ms.
  3. Edit task to "Read novel" and click **Save**.
- **Actual:** Task disappears from the UI after the delayed response returns.
- **Expected:** Task retains its updated title (or the original title if an error occurred).
- **Severity:** Major (data loss perceived by user)
- **Priority:** P1
- **Root cause:** `updateTask` finds the list entry using `updatedTask.id` returned by the server. JSONPlaceholder may return a task without an `id` or with a mismatched one on slow responses, causing `findIndex` to return `-1` and the task to be silently dropped from `this.tasks`.
- **Affected code:** `task-list.component.ts:42–45`

---

### BUG-02 — Blank task can be created by pasting whitespace *(Not confirmed by tests)*

- **Status:** Could not reproduce — TC-19 **passes** on all browsers
- **Environment:** Firefox (original report)
- **Steps:**
  1. Paste a string of spaces into the new-task input.
  2. Press **Enter** or click **Add**.
- **Actual (original):** A blank entry appears in the task list.
- **Expected:** Input is trimmed; blank tasks are rejected.
- **Severity:** Minor
- **Priority:** P2
- **Notes:** TC-19 (`validation.spec.ts`) passes, confirming that `addTask` does trim whitespace correctly — `if (!title.trim()) return` in `task-list.component.ts:28`. The original exploratory finding may have been on an older version of the component. **Needs re-verification by manual testing before closing.**

---

### BUG-03 — Filter state resets after creating a task

- **Status:** Open (not covered by current automated tests)
- **Environment:** Chromium
- **Steps:**
  1. Select the **Completed** filter.
  2. Add a new task "Test filter".
- **Actual:** The app reverts the filter to **All**.
- **Expected:** Filter stays on **Completed** (new active task is excluded from the current view).
- **Severity:** Minor
- **Priority:** P3
- **Root cause:** `unshift` mutates the `tasks` array, triggering Angular CD. The `filter` property is not reset by any code, but the re-render of `filteredTasks` may expose a zone cycle artefact. Needs instrumented repro.
- **Affected code:** `task-list.component.html:21`

---

### BUG-04 — No error feedback when the API returns a 500 *(CONFIRMED by TC-17 on all browsers)*

- **Status:** Open · **Confirmed:** 2026-02-22 · **Failing test:** TC-17 (`api-behavior.spec.ts`)
- **Error message from Allure:** `Timed out 5000ms waiting for expect(locator).toContainText(expected)` — locator `.error` matched 0 elements.
- **Environment:** Chromium / Firefox / WebKit, API stubbed to return HTTP 500
- **Steps:**
  1. Stub POST `/todos` to return status 500.
  2. Create any task.
- **Actual:** No error element is rendered. The failure is silently discarded.
- **Expected:** A user-readable error banner (e.g. "Failed to create task. Please try again.") is shown.
- **Severity:** Major
- **Priority:** P1
- **Root cause (confirmed via source code):**
  `addTask`, `updateTask`, and `deleteTask` all call `subscribe(nextCallback)` with no error handler:
  ```typescript
  // task-list.component.ts:36–38
  this.todoService.addTask(newTask).subscribe(task => {
    this.tasks.unshift(task);
  });
  ```
  When the Observable errors, RxJS invokes the default error handler (re-throws to the global zone error handler). No component state is updated; no `.error` element is ever rendered. The fix requires an error callback and a template binding:
  ```typescript
  // proposed fix (informational — app code not modified)
  this.todoService.addTask(newTask).subscribe({
    next: (task) => { this.tasks.unshift(task); },
    error: () => { this.error = 'Failed to create task. Please try again.'; }
  });
  ```
- **Affected code:** `task-list.component.ts:36–38, 41–45, 51–53`

---

### BUG-05 — Task counter badge not updated after deleting the last task

- **Status:** Open (not covered by current automated tests)
- **Environment:** Safari (WebKit)
- **Steps:**
  1. Add a single task.
  2. Delete that task.
- **Actual:** Counter badge still shows "1".
- **Expected:** Counter resets to "0" or disappears.
- **Severity:** Low
- **Priority:** P3
- **Notes:** Likely a template binding issue. `deleteTask` correctly reassigns `this.tasks`, so the counter should update. Needs manual repro to confirm the badge still exists in current markup.

---

### BUG-06 — Edit inline input persists after page reload

- **Status:** Open (not covered by current automated tests)
- **Environment:** Chrome
- **Steps:**
  1. Click **Edit** on a task (do not save).
  2. Reload the page.
- **Actual:** Edit input field is visible but the task list is empty.
- **Expected:** Editing state resets on reload.
- **Severity:** Low
- **Priority:** P3
- **Notes:** `currentTask` lives in component memory. Reload re-initialises the component with `currentTask = null`, so the bug only manifests if Angular route reuse is active. Confirm the current router config before prioritising.

---

### BUG-07 — Edited task title is not saved to the UI after clicking Save *(CONFIRMED by TC-04 on all browsers)*

- **Status:** Open · **Confirmed:** 2026-02-22 · **Failing test:** TC-04 (`crud.spec.ts`)
- **Error message from Allure:** `Timed out 5000ms waiting for expect(locator).toBeVisible()` — `.task-item` containing `.task-title` with text "Updated title" was never found.
- **Environment:** Chromium / Firefox / WebKit
- **Steps:**
  1. Add task "Original title".
  2. Click **Edit**.
  3. Clear input; type "Updated title".
  4. Click **Save**.
- **Actual:** The task title remains "Original title" after saving. The UI never shows "Updated title".
- **Expected:** Task title updates to "Updated title" immediately after saving.
- **Severity:** Critical (core editing feature is broken)
- **Priority:** P0
- **Root cause (confirmed via source code):**
  The edit input uses a one-way `[value]` binding:
  ```html
  <!-- task-list.component.html:65–71 -->
  <input
    type="text"
    [value]="currentTask?.title"
    #editInput
    class="edit-input"
  >
  ```
  Angular's `[value]` binding sets `input.value = currentTask.title` on **every change detection cycle**. When Playwright's `page.fill()` dispatches `input` and `change` events, zone.js triggers a CD cycle. Angular re-evaluates `[value]="currentTask?.title"` — which is still "Original title" (the copy made by `setCurrentTask`) — and **overwrites** the value typed by the user. By the time Save is clicked, `editInput.value` returns "Original title", not "Updated title".

  Note: TC-13 (`should PUT the updated title`) **passes** — it intercepts the network request and asserts the body. The PUT body also contains "Original title", confirming the root cause is data capture at the template level, not the service.

- **Fix direction:** Replace `[value]` with `[(ngModel)]` (two-way binding, requires `FormsModule`) or capture the live value via an `(input)` event handler that writes to a component property.
- **Affected code:** `task-list.component.html:67`

---

## Test-Code Issues (resolved in current version)

| ID | File | Issue | Resolution |
|----|------|-------|-----------|
| TC-BUG-01 | `todo.spec.ts` (old) | `await (await todo.taskLocator(...))` — double-await on a synchronous method | Removed `await` at call site; `taskLocator` returns `Locator`, not `Promise<Locator>` |
| TC-BUG-02 | `todo.spec.ts` (old) | `expect(todo.getTaskCount()).resolves.toBe(0)` — no Playwright auto-retry | Replaced with `expect(todoPage.taskList).toHaveCount(0)` |
| TC-BUG-03 | `todo.spec.ts` (old) | `page.locator('.error')` in test body — leaks UI detail out of POM | Moved to `TodoPage.errorMessage` locator |
| TC-BUG-04 | `pages/todo.page.ts` (old) | `taskLocator` used CSS string interpolation — unsafe for special characters | Replaced with `.filter({ has: page.locator('.task-title', { hasText: title }) })` |
| TC-BUG-05 | `todo.spec.ts` (old) | Each test instantiated its own `TodoPage` duplicating the fixture's instance | Replaced with a shared `todoPage` Playwright fixture |

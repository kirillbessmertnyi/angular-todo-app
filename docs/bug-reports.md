# Bug Reports for Angular ToDo App

Below are defects discovered during exploratory testing. Each report includes a title, environment, steps to reproduce, actual and expected results, severity and priority, and notes about impact.

1. **Task disappears after editing when server responds slowly**
   - **Environment:** Chrome, uncapped network latency
   - **Steps:**
     1. Create a new task "Read book".
     2. Intercept the PUT request and delay response by 2 seconds.
     3. Edit the task label to "Read novel" and save.
   - **Actual:** After the delayed response, the task disappears from the UI. Refresh shows it gone.
   - **Expected:** Task should retain updated title or show error if update failed.
   - **Severity:** Major (data loss)
   - **Priority:** P1
   - **Note:** Likely caused by failure to merge server response with local state when delayed.

2. **Empty task can be created by pasting whitespace**
   - **Environment:** Firefox
   - **Steps:**
     1. Paste a series of spaces into the new task input and press Enter.
   - **Actual:** A blank entry appears in the list.
   - **Expected:** Input should trim whitespace and prevent blank tasks.
   - **Severity:** Minor
   - **Priority:** P2
   - **Note:** Front-end validation missing; easy fix by trimming value.

3. **Filter state resets after creating a task**
   - **Environment:** Chromium
   - **Steps:**
     1. Select the "Completed" filter.
     2. Add a new task "Test filter".
   - **Actual:** App automatically switches filter back to "All" without user action.
   - **Expected:** Either stay on the chosen filter or clearly indicate reset.
   - **Severity:** Minor
   - **Priority:** P3
   - **Note:** Can confuse users who rely on filters during entry.

4. **API error handling shows raw JSON message**
   - **Environment:** Simulated server 500 error
   - **Steps:**
     1. Stub POST to return status 500 with body `{ "error": "Server crashed" }`.
     2. Create a task.
   - **Actual:** Alert popup displays raw JSON (`{"error":"Server crashed"}`) instead of a user-friendly message.
   - **Expected:** Show a readable notification like "Failed to create task. Please try again.".
   - **Severity:** Medium
   - **Priority:** P1
   - **Note:** Error handling should sanitize server responses.

5. **Task count badge not updated when deleting last task**
   - **Environment:** Safari
   - **Steps:**
     1. Add a single task.
     2. Delete that task.
   - **Actual:** Counter shows "1" even though list is empty.
   - **Expected:** Counter resets to "0" or disappears.
   - **Severity:** Low
   - **Priority:** P3
   - **Note:** UI state not synced with model after deletion.

6. **Edit modal persists after navigation**
   - **Environment:** Chrome
   - **Steps:**
     1. Start editing a task but do not save.
     2. Refresh the page.
   - **Actual:** Edit input remains visible, but underlying list is empty.
   - **Expected:** Editing state should reset on reload.
   - **Severity:** Low
   - **Priority:** P3
   - **Note:** Inconsistent UI state may confuse users.

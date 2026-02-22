# Test Cases for Angular ToDo App

This document lists the test cases designed to cover the functionality of the Angular ToDo application. A tabular format is used for clarity, making it easy to map actions to expected results and to add fields like priority or notes.

| ID | Title | Steps | Expected Result | Type | Priority | Notes |
|----|-------|-------|-----------------|------|----------|-------|
| TC-01 | Create a new task with valid title | 1. Open app\n2. Enter "Buy milk" in new task field\n3. Press Enter or click Add | Task "Buy milk" appears in list with incomplete status | Positive | P1 | API returns generated ID; list shows immediately |
| TC-02 | Edit an existing task title | 1. Ensure a task exists (create if needed)\n2. Double-click task label or click edit\n3. Change to "Buy bread" and save | Task label updates to "Buy bread" | Positive | P1 | PUT request should be sent |
| TC-03 | Delete a task | 1. Add task if none exist\n2. Click delete/trash icon next to task | Task is removed from UI list | Positive | P1 | DELETE request is fired |
| TC-04 | Mark task as completed | 1. Add new task\n2. Click checkbox next to task | Task is visually marked completed; filter "Completed" shows it | Positive | P2 | PUT request changes completed flag |
| TC-05 | Filter tasks by status | 1. Ensure some tasks active and some completed\n2. Click "Active" filter\n3. Click "Completed" filter\n4. Click "All" | List shows only correct tasks for each filter | Positive | P2 | Validates client-side filtering |
| TC-06 | Create task with empty title | 1. Focus new task field\n2. Press Enter without typing | No task should be created; optionally show validation | Negative | P1 | Check that POST is not sent or server rejects |
| TC-07 | API delay handling | 1. Configure interception to delay responses up to 2s\n2. Create/edit/delete a task\n | Application shows loading indicator or does not hang; operation completes within reasonable timeout | Edge / Non-functional | P2 | Use Playwright route to mock delays |
| TC-08 | Handle API failure (e.g., 500) | 1. Stub POST/PUT/DELETE to return 500 error\n2. Perform create/edit/delete | App displays error message and allows retry; UI state remains consistent | Negative | P1 | Tests robustness to server errors |
| TC-09 | Create multiple tasks quickly | 1. Rapidly add 5 tasks one after another | All tasks show in list with unique IDs from API; no duplicates | Boundary | P3 | Ensures id-generation and UI update works under load |
| TC-10 | Edit a task to empty string | 1. Create task\n2. Edit and clear title\n3. Save | App either prevents and shows validation message or deletes the task per spec | Boundary/negative | P2 | Clarify behavior requirement |
| TC-11 | Delete non-existent task (after page refresh) | 1. Add task\n2. Refresh page (task gone due to API)\n3. Attempt to delete using previous UI state (maybe via network intercept) | App should handle gracefully (no errors) and reload state | Edge | P3 | Covers API non-persistence
| TC-12 | Verify task ID generation on create | 1. Create a task\n2. Inspect network response to confirm an ID is returned and used | ID field is populated and used in subsequent requests | Positive | P2 | Ensures API contract adherence |
| TC-13 | Change filter then add task | 1. Select "Completed" filter\n2. Add task | New task appears in list (even though it is active) and filter resets or still shows correctly | Edge | P3 | Behavioral expectation should be defined |
| TC-14 | Persistent state should not exist | 1. Create tasks\n2. Refresh page\n | List should empty because API doesn't persist | Edge/negative | P3 | Confirms API behavior is communicated to user |
| TC-15 | Ensure maximum delay tolerant | 1. Simulate 2s network delay for all requests\n2. Perform sequence of operations | UI allows no more than 5 seconds per operation; does not freeze | Non-functional | P3 | Stress on delay tolerance |


*Format note:* We chose a **table** because it provides a structured, easily scannable view of test cases with fields for ID, steps, expected results, type, priority, and notes. This suits both manual and automated testing documentation. It also translates well when converting into tooling or spreadsheets.
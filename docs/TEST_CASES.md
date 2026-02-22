# Test Cases — Angular ToDo App

Test cases are organised by the same three areas as the spec files.
**P0** = blocker, **P1** = critical, **P2** = major, **P3** = minor/nice-to-have.

---

## CRUD Operations (`crud.spec.ts`)

| ID | Title | Preconditions | Steps | Expected Result | Type | Priority | Spec |
|----|-------|--------------|-------|-----------------|------|----------|------|
| TC-01 | Add task via button | Empty list | 1. Enter "Buy milk" in input. 2. Click **Add**. | Task "Buy milk" appears in the list. | Positive | P1 | `crud.spec.ts` |
| TC-02 | Add task via Enter | Empty list | 1. Enter "Press Enter task". 2. Press **Enter**. | Task appears in the list. | Positive | P1 | `crud.spec.ts` |
| TC-03 | Input cleared after add | Empty list | 1. Type any text. 2. Click **Add**. | Input field is empty after submission. | Positive | P2 | `crud.spec.ts` |
| TC-04 | Edit task title | One task exists | 1. Click **Edit** on a task. 2. Change title to "Updated title". 3. Click **Save**. | New title is shown; old title is gone. | Positive | P1 | `crud.spec.ts` |
| TC-05 | Delete a task | One task exists | 1. Click **Delete** on the task. | Task removed from list; list is empty. | Positive | P1 | `crud.spec.ts` |
| TC-06 | Toggle task to completed | One active task | 1. Click the checkbox next to the task. | Task title gains `completed` CSS class. | Positive | P2 | `crud.spec.ts` |
| TC-07 | Toggle completed task back to active | One completed task | 1. Click checkbox again. | `completed` class removed from title. | Positive | P2 | `crud.spec.ts` |
| TC-08 | Filter: Completed | Mixed list | 1. Add two tasks. 2. Complete one. 3. Click **Completed**. | Only the completed task is visible. | Positive | P2 | `crud.spec.ts` |
| TC-09 | Filter: Active | Mixed list | 1. Same setup. 2. Click **Active**. | Only the active task is visible. | Positive | P2 | `crud.spec.ts` |
| TC-10 | Filter: All | Mixed list after filtering | 1. Click **All** after any filter. | Both tasks visible; count = 2. | Positive | P2 | `crud.spec.ts` |

---

## API Behaviour (`api-behavior.spec.ts`)

| ID | Title | Preconditions | Steps | Expected Result | Type | Priority | Spec |
|----|-------|--------------|-------|-----------------|------|----------|------|
| TC-11 | Initial load from API | Mock returns 2 tasks | 1. Set up mock with 2 tasks. 2. Navigate to `/`. | Both tasks rendered immediately. | Positive | P1 | `api-behavior.spec.ts` |
| TC-12 | POST body on task creation | Empty list | 1. `waitForRequest` (POST). 2. Add "My new task". | Request body contains `{ title: "My new task", completed: false }`. | Contract | P1 | `api-behavior.spec.ts` |
| TC-13 | PUT body on task edit | One task exists | 1. `waitForRequest` (PUT). 2. Edit task to "Edited". | Request body contains `{ title: "Edited" }`. | Contract | P1 | `api-behavior.spec.ts` |
| TC-14 | DELETE URL contains task ID | One task exists | 1. `waitForRequest` (DELETE). 2. Delete task. | URL matches `/todos/<numeric-id>`. | Contract | P1 | `api-behavior.spec.ts` |
| TC-15 | API returns id on create | Empty list | 1. `waitForResponse` (POST). 2. Add a task. | Response JSON contains a numeric `id > 0`. | Contract | P2 | `api-behavior.spec.ts` |
| TC-16 | Delayed response handled | Mock has 2 s delay | 1. Add a task. 2. Wait up to 5 s. | Task appears within timeout. | Resilience | P2 | `api-behavior.spec.ts` |
| TC-17 | Error message on 500 | Mock returns 500 | 1. Add a task. | Error banner containing "failed" is visible. | Negative | P1 | `api-behavior.spec.ts` |

---

## Validation & Edge Cases (`validation.spec.ts`)

| ID | Title | Preconditions | Steps | Expected Result | Type | Priority | Spec |
|----|-------|--------------|-------|-----------------|------|----------|------|
| TC-18 | Empty input rejected | Empty list | 1. Clear input. 2. Click **Add**. | Task count remains 0. | Negative | P1 | `validation.spec.ts` |
| TC-19 | Whitespace-only input rejected | Empty list | 1. Type "   ". 2. Click **Add**. | Task count remains 0. | Negative | P1 | `validation.spec.ts` |
| TC-20 | No POST for empty input | Empty list | 1. Set up 1-s request watcher. 2. Submit empty input. | No POST request is sent. | Contract | P1 | `validation.spec.ts` |
| TC-21 | Edit to empty string rejected | One task exists | 1. Edit task. 2. Clear title. 3. Save. | No blank entry in list; count is 0 or 1. | Negative | P2 | `validation.spec.ts` |
| TC-22 | Rapid task creation | Empty list | 1. Add 5 tasks sequentially. | All 5 tasks present; count = 5. | Boundary | P3 | `validation.spec.ts` |
| TC-23 | Empty list after reload | One task added | 1. Add a task. 2. Reload page. | List is empty (API does not persist). | Edge | P3 | `validation.spec.ts` |

---

## Format Note

A table was chosen because it provides a structured, scannable view that maps directly to automated test IDs (TC-XX), making it easy to trace failures from CI output back to documented requirements. The table format also translates cleanly to Jira/Xray or any spreadsheet-based test management tool.

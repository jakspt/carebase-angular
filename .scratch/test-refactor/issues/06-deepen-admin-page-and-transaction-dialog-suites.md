# 06: Deepen Admin Page and Transaction Dialog Behavioral Suites

**What to build:** Replace superficial `it('should create')` smoke tests in the Admin Page and Asynchronous Transaction Dialog test suites with comprehensive behavioral specifications covering database migration and seed confirmation dialogs, async transaction state transitions (`confirm` -> `loading` -> `success` / `error`), progress bar rendering, and modal dismissal blocking.

**Blocked by:** 04 (Implement provideTestHospitalData and Eliminate Collaborator Spies)

**Status:** resolved

- [x] Admin Page tests verify that clicking the database migration and seed actions initiates dialog confirmation with the correct parameters
- [x] Transaction Dialog tests verify the state machine transitions from initial confirmation to loading upon execution
- [x] Transaction Dialog tests verify progress indicator rendering and dismiss prevention (`disableClose = true`) while an async task is running
- [x] Successful completion transitions the dialog state to success and permits modal dismissal
- [x] Failure in the async task transitions the dialog state to error with visible failure messaging


# 05: Implement Declarative Modal Confirmation and Migrate Admin Database Operations

**What to build:** Extend the `OperationRunner` with declarative modal confirmation support for high-impact operations (`requireConfirmation: true`), prompting the user before execution and cleanly aborting with a cancelled status if dismissed. Refactor the Admin page so database migration and database seeding delegate to `OperationRunner.execute()` with declarative titles, descriptions, and confirmation prompts. Preserves ADR 0001 invariants: database migration permanently switches runtime persistence to MongoDB, while database seeding populates MariaDB independently without altering MongoDB demonstration state.

**Blocked by:** 01: Implement Core OperationRunner Service, Signal Forms Bridge, and Feedback Delivery

**Status:** resolved

- [x] `OperationRunner` supports `requireConfirmation: true`, displaying a modal confirmation dialog before proceeding with execution.
- [x] Cancelling or dismissing the modal aborts execution and returns `{ status: 'cancelled' }` without invoking the underlying mutative action.
- [x] High-impact operations display progress indication and completion messaging within the modal lifecycle.
- [x] Admin database migration and database seeding actions are refactored to delegate declaratively to `OperationRunner.execute()`.
- [x] ADR 0001 invariants are preserved: database migration triggers MongoDB switch; database seeding populates MariaDB without modifying MongoDB state.
- [x] Direct invocation of standalone transaction dialogs is replaced by runner orchestration.
- [x] Unit and component test suites verify modal confirmation, cancellation abortion, execution progress, and ADR 0001 behavioral compliance.

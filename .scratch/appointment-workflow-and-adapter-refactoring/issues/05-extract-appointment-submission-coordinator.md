# 05: Extract Appointment Submission Coordinator and Decompose Workflow

**What to build:** A decoupled appointment intake workflow where asynchronous booking submission, conflict detection, and slot reload recovery are handled by a dedicated coordinator service. The intake workflow injects the scheduling capability token and focuses on reactive wizard state, standardizing on canonical appointment terminology and dropping below 280 lines of code.

**Blocked by:** 01: Extract Shared Reactive and Date Utilities, 03: Implement Data Access Interface Segregation, 04: Tidy and Deepen In-Memory Hospital Adapter

**Status:** resolved

- [x] Injectable appointment submission coordinator is created to handle validation, request creation, operation runner execution, 409 conflict detection, and error message resolution.
- [x] Appointment intake workflow injects the scheduling data access token instead of the monolithic port.
- [x] Intake workflow delegates submission execution and slot conflict reload callbacks to the submission coordinator.
- [x] Intake workflow consumes the shared debounced loading and date parsing utilities.
- [x] Property names in the intake workflow standardize on appointment terminology with backward-compatible aliases for booking forms.
- [x] Dedicated unit tests verify the submission coordinator in isolation with mock scheduling data access and operation runner.
- [x] Existing Material stepper component harness tests continue passing without regression.

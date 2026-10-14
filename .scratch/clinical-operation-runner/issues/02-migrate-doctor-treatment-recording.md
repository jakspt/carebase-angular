# 02: Migrate Doctor Treatment Recording to OperationRunner

**What to build:** Migrate Doctor clinical Treatment recording to use the `OperationRunner`. The Doctor treatment form submission delegates its mutative workflow to the runner's Signal Forms submission bridge, removing component-level submission tracking flags, manual try/catch blocks, and imperative snackbar notifications. Stepper controls and submission buttons bind to the runner's interaction lock to prevent concurrent submissions and duplicate clinical records.

**Blocked by:** 01: Implement Core OperationRunner Service, Signal Forms Bridge, and Feedback Delivery

**Status:** resolved

- [x] Doctor treatment form submission delegates to `OperationRunner.submitForm()`.
- [x] Component-level `isSubmitting` signal and manual try/catch blocks are removed from the Doctor workflow.
- [x] Direct `MatSnackBar` injection and imperative snackbar opening are removed in favor of runner feedback configuration.
- [x] Submission buttons and interactive stepper navigation are locked while a treatment mutation is in flight.
- [x] Invalid treatment forms (such as negative or excessive costs) are gated prior to submission execution.
- [x] Successful treatment recording updates clinical records in the data store and displays standardized success feedback.
- [x] Doctor test suite verifies treatment submission, form validation gating, interaction locking, and error notification via component harnesses and test providers.

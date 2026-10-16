# 05: Collapse artificial seam in Appointment Intake and deduplicate test suites

**What to build:** Eliminate the artificial seam between the Appointment Intake view component and workflow service by binding the component view template directly to the workflow state, purging ~60 redundant forwarding getters and methods. Retain multi-file separation with the component handling DOM and view concerns, while consolidating test coverage around the canonical Angular Material CDK component harness suite and removing duplicate multi-step flow tests from the headless workflow suite.

**Blocked by:** 01: Retire shallow DoctorService and ClerkService

**Status:** claimed

- [ ] The Appointment Intake template binds directly to workflow state and methods where appropriate, eliminating pass-through forwarders on the component class.
- [ ] The Appointment Intake component class retains only DOM, focus, and view-coordination responsibilities (e.g. stepper resetting and input focusing).
- [ ] The component harness test suite remains the authoritative end-to-end behavioral test suite for the intake stepper per ADR 0003.
- [ ] Redundant duplicate multi-step flow scenarios in the headless workflow test suite are pruned, leaving focused unit checks for workflow-specific state transitions.
- [ ] The appointment scheduling workflow (patient search, doctor selection, slot booking, conflict handling, and reset) behaves identically for the user.

# 01: Extract Headless AppointmentIntakeWorkflow Core State Machine

**What to build:** Extract the appointment intake workflow state machine from the monolithic UI component into a headless deep module (`AppointmentIntakeWorkflow`) scoped to the component injector. It orchestrates patient search, department filtering, doctor selection with declarative `linkedSignal` reset when department changes, date selection, time slot queries with declarative `linkedSignal` reset when doctor or date changes, and ambient acting clerk resolution. All behavior is verified headlessly using Angular's standard HTTP testing utilities.

**Blocked by:** None (can start immediately)

**Status:** resolved

## Acceptance Criteria

- [x] `AppointmentIntakeWorkflow` is created as an injectable service provided at the component level.
- [x] Patient search query is debounced and exposes reactive patient search results and spinner state.
- [x] Hospital departments are dynamically extracted from loaded doctors.
- [x] `selectedDoctor` is modeled with `linkedSignal` to automatically reset to `null` if `selectedDepartment` changes and the doctor does not practice in that department.
- [x] Date selection is clamped to midnight of today or future dates (`minDate`).
- [x] `selectedTimeSlot` is modeled with `linkedSignal` to automatically reset to `null` whenever `selectedDoctor` or `selectedDate` changes.
- [x] Time slots are queried automatically based on doctor, patient, and date, exposing reactive slot list, debounced slot spinner, and proactive next available date guidance.
- [x] Ambient acting Clerk is resolved directly from `ClerkService`.
- [x] Headless unit tests verify all state transitions, queries, and `linkedSignal` cascading resets using `provideHttpClientTesting`.

## Comments

- Implemented `AppointmentIntakeWorkflow` in `src/app/clerk-use-case/appointment-intake-workflow.ts`.
- Verified headless unit tests in `src/app/clerk-use-case/appointment-intake-workflow.spec.ts`.
- Verified `ng build` cleanly passes.

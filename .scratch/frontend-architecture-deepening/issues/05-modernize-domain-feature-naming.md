# Modernize Domain Feature Naming ("Intent over Role")

Status: ready-for-agent

## Context

Feature folders currently use technical pattern suffixes (`clerk-use-case`, `doctor-use-case`) rather than ubiquitous domain vocabulary from `GLOSSARY.md` and modern Angular v20+ naming conventions ("Intent over Role").

## Requirements

1. Rename directories and their internal files:
   - `src/app/clerk-use-case/` $\rightarrow$ `src/app/appointment-intake/` (Component: `AppointmentIntake`)
   - `src/app/doctor-use-case/` $\rightarrow$ `src/app/treatment-recording/` (Component: `TreatmentRecording`)
   - `src/app/clerk-report/` $\rightarrow$ `src/app/consultation-frequency-report/` (Component: `ConsultationFrequencyReport`)
   - `src/app/doctor-report/` $\rightarrow$ `src/app/doctor-earnings-report/` (Component: `DoctorEarningsReport`)
2. Update component selectors, templates, styles, and test files to reflect the new domain names.
3. Update `app.routes.ts` routes and navigation links across the application.
4. Verify all tests pass with `npx ng test --watch=false`.

## Verification

- File and class names reflect domain intent per `GLOSSARY.md`.
- No technical `-use-case` directory names remain.
- Full test suite passes cleanly.

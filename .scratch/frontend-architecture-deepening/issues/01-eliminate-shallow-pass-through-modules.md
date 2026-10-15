# Eliminate Shallow Pass-Through Modules (DoctorService & ClerkService)

Status: ready-for-agent

## Context

`DoctorService` is completely unused across the application (zero consumers), acting as dead code. `ClerkService` is an empty one-line pass-through facade wrapping `HospitalDataAccess` and `ActorSession`. Callers should bind directly to the hexagonal `HospitalDataAccess` seam and `ActorSession`.

## Requirements

1. Delete `src/app/services/doctor-service.ts`.
2. Inspect and remove any unused references to `DoctorService`.
3. Remove `ClerkService` dependency from `src/app/clerk-use-case/appointment-intake-workflow.ts` and `src/app/clerk-use-case/appointment-intake-workflow.spec.ts`. Call `this.hospitalDataAccess.bookAppointment()` and `this.actorSession.setActiveClerk()` directly.
4. Delete `src/app/services/clerk-service.ts` and its spec `src/app/services/clerk-service.spec.ts`.
5. Verify all tests pass with `npx ng test --watch=false`.

## Verification

- `DoctorService` and `ClerkService` files no longer exist.
- `npx ng test --watch=false` passes without failures.

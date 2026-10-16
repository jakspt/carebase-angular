# 01: Retire shallow DoctorService and ClerkService

**What to build:** Eliminate shallow pass-through services (`DoctorService` and `ClerkService`) that act as thin indirection layers over actor session state and the hexagonal data access port. Consumers and test suites interact directly with the actor session and the hospital data access port.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `DoctorService`, `ClerkService`, and `clerk-service.spec.ts` are permanently removed from the codebase.
- [x] The Appointment Intake workflow and test suites consume `ActorSession` and the `HOSPITAL_DATA_ACCESS` token directly for clerk state and appointment booking.
- [x] Active clerk selection, appointment booking, and session management behavior remain unchanged from the user's perspective.
- [x] All existing test suites pass green with zero reliance on the deleted forwarder services.

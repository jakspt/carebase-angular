# 04: Implement provideTestHospitalData and Eliminate Collaborator Spies

**What to build:** Create a reusable test dependency injection helper function (`provideTestHospitalData`) that binds the hospital data access port to the in-memory hospital data adapter. Migrate the Appointment intake workflow and multi-step intake wizard suites to assert on retrievable appointment records and slot reservations in the data store instead of spying on collaborator methods (`clerkService.bookAppointment`, `dataAccess.getDoctors`) and checking call counts.

**Blocked by:** 02 (Replace settle setTimeout Sleeps with Deterministic vi.waitFor)

**Status:** complete

- [x] A reusable `provideTestHospitalData()` dependency injection provider helper is implemented for test modules
- [x] Spies on domain methods like `clerkService.bookAppointment`, `dataAccess.getDoctors`, and `dataAccess.getTimeSlots` are removed from the intake workflow and wizard suites
- [x] Appointment booking tests assert that an Appointment record is created and retrievable, and that the chosen Time Slot is marked unavailable in the data store
- [x] Call-count assertions (`toHaveBeenCalledWith`, `toHaveBeenCalled`) on internal collaborators are eliminated across the migrated suites
- [x] Test isolation relies on injector teardown per test rather than custom adapter reset APIs

# 01: Extract Shared Reactive and Date Utilities

**What to build:** Standalone reactive and date utility functions providing flicker-free debounced progress indicator signals and normalized ISO date parsing. Deduplicates loading spinner logic across administrative and financial reports, ensuring consistent loading behaviors while isolating date calculations into instant, pure unit tests.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Reusable debounced loading signal helper is extracted and accepts an active loading signal and optional threshold delay.
- [x] ISO date parsing utility is extracted and correctly normalizes string dates and Date objects with zeroed timestamps.
- [x] Consultation Frequency Report consumes the shared debounced loading utility, removing inlined RxJS pipes.
- [x] Doctor Earnings Report consumes the shared debounced loading utility, removing inlined RxJS pipes.
- [x] Dedicated unit test suites verify debounced loading and date parsing behaviors with sub-millisecond execution.

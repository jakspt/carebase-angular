# 01: Co-locate provideTestAdminService and Eliminate Duplicated Stubs

**What to build:** Author and export a reusable `provideTestAdminService()` dependency injection helper function in `src/app/services/admin-service.ts`. Refactor `src/app/app.spec.ts` and `src/app/header-layout/header-layout.spec.ts` to consume this helper instead of defining inline mock `AdminService` objects with duplicate `statusResource` signal structures.

**Blocked by:** None (Frontier)
**Type:** task
**Status:** resolved

- [x] `provideTestAdminService()` is exported from `src/app/services/admin-service.ts` providing deterministic reactive status signals
- [x] `src/app/app.spec.ts` consumes `provideTestAdminService()` instead of an inline mock object
- [x] `src/app/header-layout/header-layout.spec.ts` consumes `provideTestAdminService()` instead of an inline mock object
- [x] All tests in `app.spec.ts` and `header-layout.spec.ts` pass 100% green without regression

## Answer

Implemented and exported `provideTestAdminService()` in `src/app/services/admin-service.ts` accepting customizable configuration options (`dbType`, `isLoading`, `hasValue`) and providing realistic reactive signals for `statusResource` along with stubs for `seedDatabase`, `migrateDatabase`, and `refreshStatus`.

Refactored `src/app/app.spec.ts` and `src/app/header-layout/header-layout.spec.ts` to consume `provideTestAdminService()`. Added comprehensive unit tests in `src/app/services/admin-service.spec.ts` and deepened `header-layout.spec.ts` to assert against reactive database status badge states. All tests pass green.

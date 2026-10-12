# 01: Co-locate provideTestAdminService and Eliminate Duplicated Stubs

**What to build:** Author and export a reusable `provideTestAdminService()` dependency injection helper function in `src/app/services/admin-service.ts`. Refactor `src/app/app.spec.ts` and `src/app/header-layout/header-layout.spec.ts` to consume this helper instead of defining inline mock `AdminService` objects with duplicate `statusResource` signal structures.

**Blocked by:** None (Frontier)

**Status:** ready-for-agent

- [ ] `provideTestAdminService()` is exported from `src/app/services/admin-service.ts` providing deterministic reactive status signals
- [ ] `src/app/app.spec.ts` consumes `provideTestAdminService()` instead of an inline mock object
- [ ] `src/app/header-layout/header-layout.spec.ts` consumes `provideTestAdminService()` instead of an inline mock object
- [ ] All tests in `app.spec.ts` and `header-layout.spec.ts` pass 100% green without regression

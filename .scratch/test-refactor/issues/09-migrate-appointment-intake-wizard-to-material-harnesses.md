# 09: Migrate Appointment Intake Wizard to Material Harnesses

**What to build:** Modernize the multi-step Appointment intake wizard test suite to interact with UI controls exclusively through Angular Material and CDK component harnesses (`MatStepperHarness`, `MatButtonHarness`, `MatInputHarness`, `ActionCardHarness`). Eradicate brittle CSS class queries (`.selected-entity-card`, `.step-actions`, `button[matStepperNext]`, `.mat-mdc-form-field-subscript-wrapper`) and eliminate manual stepper index mutations (`stepper.selectedIndex = 1`).

**Blocked by:** 04 (Implement provideTestHospitalData and Eliminate Collaborator Spies), 08 (Author ActionCardHarness and Modernize Reusable Component Testing)

**Status:** ready-for-agent

- [ ] All step navigation and validation in the Appointment intake wizard test suite are performed using `MatStepperHarness`
- [ ] Stepper index direct mutations (`stepper.selectedIndex = N`) are eliminated in favor of clicking step headers or next buttons via harnesses
- [ ] Patient selection, doctor selection, date picker, and slot interactions are performed using official component harnesses
- [ ] Brittle CSS class selectors and references to private Material DOM wrappers are completely removed
- [ ] Stepper form submission and concurrent booking collision (HTTP 409) step recovery are verified through harnesses

# Medication Dosage and Administration Instructions

Status: needs-triage
Category: enhancement

## Problem Statement

When a Doctor documents a Treatment, medications are currently selected from the pharmaceutical catalog purely by PZN and Name. There is no ability to specify dosage (e.g. "500 mg") or administration instructions (e.g. "Twice daily after meals for 7 days"). In realistic clinical documentation, medications always carry dosing instructions alongside the drug substance.

## Proposed Solution

1. **Data Model Extensions**:
   - In MariaDB, add `Dosierung VARCHAR(100)` and `Anweisung VARCHAR(255)` columns to the `Verabreichung` join table.
   - In MongoDB, update the embedded `medikamente` subdocument structure within treatments: `{ "pzn": int, "name": str, "dosage": str, "instructions": str }`.
   - Update `DataMigrator` in `app/admin/db_migration.py` to transfer dosage and instructions fields.
2. **Backend API**:
   - Update `POST /api/doctor/patients/<patient_id>/appointments/<appt_id>/treatments` to accept `dosage` and `instructions` for each medication in the payload.
3. **Frontend UI**:
   - In `DoctorUseCase` ([`doctor-use-case.ts`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/frontend/carebase-frontend/src/app/doctor-use-case/doctor-use-case.ts)), allow entering optional dosage and instruction inputs when adding a selected medication chip.
   - Display dosage and instructions in the treatment summary before submission.

## Acceptance Criteria

- A Doctor can enter dosage and instructions when attaching medications to a treatment.
- Both fields are persisted in MariaDB (`Verabreichung`) and embedded in MongoDB patient documents.
- Data migrator transforms existing dosage records from MariaDB into MongoDB.
- Absence of dosage/instructions does not block submitting treatments with bare catalog medications.

## Comments

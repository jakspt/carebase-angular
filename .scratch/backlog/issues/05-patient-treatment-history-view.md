# Patient Treatment History and Clinical Audit View

Status: needs-triage
Category: enhancement

## Problem Statement

While doctors can record new treatments for an appointment, neither doctors nor clerks can inspect historical treatments that were previously recorded. Once a treatment is submitted, its notes, associated costs, and administered medications cannot be reviewed in the frontend UI. This prevents clinicians from reviewing past interventions before administering new care.

## Proposed Solution

1. **Backend API Extension**:
   - Update `GET /api/doctor/patients/<patient_id>` to include full treatment records in the appointment response:
     ```json
     {
       "id": 1,
       "date": "2026-05-10",
       "time": "09:30",
       "doctorName": "Dr. Smith",
       "reason": "Chest pain",
       "treatments": [
         {
           "id": 101,
           "description": "ECG and cardiac enzyme panel",
           "cost": 150.0,
           "medications": [{ "id": 12, "name": "Aspirin" }]
         }
       ]
     }
     ```
   - Update both MariaDB and MongoDB strategy implementations to fetch and return historical treatments alongside appointments.
2. **Frontend UI**:
   - In `DoctorUseCase` (or a dedicated patient details drawer/dialog), show existing treatments under each appointment card or expander.
   - Display description, cost, and prescribed medication chips for each past treatment.

## Acceptance Criteria

- When inspecting a patient's appointments in the Doctor portal, previously documented treatments are visible with their descriptions, costs, and medications.
- Works identically whether reading from MariaDB or MongoDB.
- Adding a new treatment updates the appointment's treatment list immediately upon submission.

## Comments

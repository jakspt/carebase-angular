# Appointment Cancellation and Rescheduling

Status: needs-triage
Category: enhancement

## Problem Statement

Currently, the system only supports creating appointments. Once an Appointment is scheduled by a Clerk, there is no way to cancel or reschedule it. If a patient or doctor cannot attend, the 30-minute Time Slot remains permanently locked, and two-sided collision detection prevents booking any alternative appointment for either party at that time.

## Proposed Solution

1. **Backend Endpoints**:
   - `DELETE /api/clerk/appointments/<appointment_id>` to cancel an appointment.
   - `PATCH /api/clerk/appointments/<appointment_id>` to reschedule an appointment to a new date and time slot with collision detection.
2. **Database Strategy Implementation**:
   - **MariaDB**: Delete the corresponding row in `Termin` (or set a cancellation flag), ensuring foreign key constraints with `Behandlung` are properly handled (prevent cancellation if treatments already exist, or cascade appropriately).
   - **MongoDB**: Remove the document from the `appointments` collection and pull the appointment subdocument from the patient's embedded `termine` array.
3. **Frontend UI**:
   - In the Clerk portal, provide a list/search of upcoming appointments per patient or doctor with "Cancel" and "Reschedule" actions.
   - Rescheduling should reuse the slot-picker and two-sided collision detection.

## Acceptance Criteria

- A Clerk can cancel an existing appointment that has no recorded treatments.
- Cancelling an appointment frees the 30-minute Time Slot for both the Doctor and the Patient.
- Rescheduling moves the appointment to a new available Time Slot and validates against conflicts.
- Both MariaDB and MongoDB strategies reflect the cancellation/rescheduling consistently.

## Comments

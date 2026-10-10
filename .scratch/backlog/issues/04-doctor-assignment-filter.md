# Doctor Portal Appointment Assignment Filter

Status: needs-triage
Category: enhancement

## Problem Statement

In the simulated role model, entering the Doctor portal sets the user role to "doctor" globally, but does not identify *which* specific Doctor is operating. When searching a Patient, all past and future appointments across all doctors and departments are shown in an unpartitioned list. A doctor cannot filter specifically for consultations assigned to them, nor see an overview agenda of their own upcoming appointments.

## Proposed Solution

1. **Active Doctor Selection**:
   - Provide an "Active Doctor" selector in the Doctor portal (analogous to the active Clerk selector in `ClerkUseCase`), allowing the user to select which physician identity they are simulating.
2. **Appointment Filtering**:
   - In `DoctorUseCase`, add an appointment filter toggle: "My Appointments" (filtering `appointments` where `doctorName` or `doctorSsn` matches the active doctor) vs "All Patient Appointments".
3. **Doctor Daily Schedule View**:
   - Optionally introduce a schedule view showing the active Doctor's booked appointments for a selected date.

## Acceptance Criteria

- User can choose an active Doctor persona in the Doctor portal.
- Doctor Use Case allows filtering the selected patient's appointments to show only appointments assigned to the active doctor.
- Non-matching appointments remain viewable when selecting "All Appointments".
- Treatment submission links the active doctor's identity appropriately.

## Comments

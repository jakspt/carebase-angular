# CareBase

A hospital information system demonstrating a dual-database architecture with interchangeable relational and document persistence.

## Language

**Doctor**:
A medical professional who reviews patient histories and records clinical treatments and prescribed medications.
_Avoid_: Physician, Arzt, Clinician

**Clerk**:
An administrative staff member responsible for scheduling conflict-free patient appointments.
_Avoid_: Sachbearbeiter, Receptionist, Administrator

**Patient**:
An individual receiving medical care within the hospital system.
_Avoid_: Client, Person, Patientin

**Department**:
A clinical or administrative division of the hospital to which doctors are assigned.
_Avoid_: Abteilung, Ward, Clinic, Division

**Appointment**:
A scheduled consultation reserved between a specific patient and a doctor at a designated date and time slot.
_Avoid_: Termin, Booking, Reservation, Visit

**Time Slot**:
A discrete 30-minute booking window between 08:00 and 17:00 available for scheduling appointments.
_Avoid_: Interval, Period, Appointment window

**Treatment**:
A clinical intervention and associated cost recorded by a doctor for an appointment.
_Avoid_: Behandlung, Procedure, Care record

**Medication**:
A pharmaceutical product prescribed or administered during a treatment.
_Avoid_: Drug, Medicine, Medikament, Pharmazeutikum

**Social Security Number (SSN)**:
The unique governmental identification number identifying persons (patients, doctors, and clerks).
_Avoid_: SVNr, Social Insurance Number, Tax ID, National ID

**NACA Score**:
The National Advisory Committee for Aeronautics scale rating (0 to 7) indicating the medical emergency severity of a patient.
_Avoid_: Triage level, Emergency score, Severity grade

**Consultation Frequency Report**:
An administrative analytical report aggregating the frequency of completed patient consultations across doctors and departments over a specified date range.
_Avoid_: Visit Frequency Report, Visit report, Besuchsbericht, Patient visits report


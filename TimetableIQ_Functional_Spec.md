# TimetableIQ — Functional Specification
> This document defines the complete functionality of the TimetableIQ web application.
> It is written for an AI agent to use as the single source of truth when building the system.
> No design decisions are made here — only what the system must do.

---

## 1. Project Overview

TimetableIQ is a browser-based web application for students of CUIATD (COMSATS University Islamabad, Abbottabad Campus).
It reads timetable and teacher data from two Excel files maintained by the TechNest team and exposes that data through a set of tools that make semester planning fast and accurate.

There is no login, no authentication, and no user accounts anywhere in the system.
Every feature is accessible to anyone who opens the application in a browser.
The UI must work correctly on both desktop and mobile screen sizes.

---

## 2. Data Sources

### 2.1 Timetable Excel File

**Filename (suggested):** `timetable.xlsx`

This file contains one sheet. Every row represents one class slot. The columns are exactly:

| Column | Description |
|---|---|
| `Department` | Either `CS` or `SE` |
| `Section` | Section label, e.g. `CS-3A`, `SE-2B` |
| `Day` | Day of the week, e.g. `Monday`, `Tuesday` |
| `Start Time` | Class start time, e.g. `08:00`, `09:30` |
| `End Time` | Class end time, e.g. `09:00`, `10:30` |
| `Course` | Full course name, e.g. `Data Structures` |
| `Room` | Room identifier, e.g. `CS-101`, `Lab-3` |
| `Instructor` | Full name of the teacher, e.g. `Dr. Ahmed Khan` |

**Rules:**
- Both CS and SE departments are in this single sheet.
- The team updates this file manually each semester.
- The application must re-read the file after each update without requiring code changes.
- Empty rows must be skipped silently.
- There is no row limit assumption — the file may grow each semester.

---

### 2.2 Teacher Directory Excel File

**Filename (suggested):** `teachers.xlsx`

This file contains one sheet. Every row represents one teacher. The columns are exactly:

| Column | Description |
|---|---|
| `Name` | Full name, must match exactly with `Instructor` column in timetable file |
| `Email` | University email address |
| `Office Room` | Room number or label of the teacher's office |
| `Office Hours` | Text description of available hours, e.g. `Mon 10:00–12:00, Wed 2:00–4:00` |

**Rules:**
- The `Name` column is the join key between the two files.
- Matching must be case-insensitive and trim whitespace on both sides before comparing.
- If a teacher appears in the timetable but not in the teacher file, their timetable data still shows but the email, office room, and office hours fields show as "Not available".
- If a teacher appears in the teacher file but not in the timetable, they still appear in the Teacher Directory feature.

---

## 3. Data Loading and Parsing

- On application start, the backend reads both Excel files from a known local directory (e.g. `/data/`).
- The parsed data is held in memory as structured objects (not re-read on every request).
- A manual reload endpoint must exist: `POST /api/reload` — when called, it re-reads both Excel files and refreshes the in-memory data. This is used by the TechNest team after updating the files each semester.
- All time values must be stored and compared as 24-hour `HH:MM` strings internally.
- If a file is missing or unreadable on startup, the application must log a clear error and continue running (other features using the available file still work).

---

## 4. Features

---

### 4.1 Clash Detector

**Purpose:** Allow a student to select multiple courses and instantly find out if any two of them overlap in time on the same day.

**How it works:**

1. The student selects a department filter (`CS`, `SE`, or `All`).
2. A list of all unique courses for that filter is shown.
3. Each course entry shows: course name, section, instructor, day, start time, end time, room.
4. The student selects any number of courses from the list by checking them.
5. As soon as 2 or more courses are selected, the system checks for clashes in real time (no submit button needed).
6. A clash exists when two selected courses share the same day AND their time ranges overlap.
7. Time overlap rule: Course A clashes with Course B if `A.start < B.end AND A.end > B.start` on the same day.
8. Clashing pairs are clearly identified in the results — showing which two courses clash, on which day, and what the conflicting times are.
9. If no clash is found, a clear "No clashes found" message is shown.
10. The student can deselect courses and the results update immediately.

**Edge cases:**
- A course with the same name but different sections taught at different times is treated as separate entries.
- Selecting only one course shows no clash result (need at least two).

---

### 4.2 Personal Timetable Builder

**Purpose:** Allow a student to select their registered courses and generate a clean personal semester timetable showing only their classes.

**How it works:**

1. The student selects a department filter (`CS`, `SE`, or `All`).
2. A list of all courses is shown — same format as Clash Detector.
3. The student selects their courses by checking them.
4. The system generates a weekly timetable grid in real time:
   - Rows = Days of the week (Monday through Saturday, or whichever days exist in the data)
   - Columns = Time slots (derived from the data, not hardcoded)
   - Each cell shows the course name, room, and instructor for that slot
   - Empty cells are blank
5. If any two selected courses clash, a warning is shown on the timetable (the cell is marked as a conflict).
6. The student can export the timetable as a **PDF** or save it as a **PNG image**.
   - The exported file must show only the student's selected courses in the grid layout.
   - Export must work on both desktop and mobile browsers.

---

### 4.3 Teacher Timetable View

**Purpose:** Allow a student to see the full timetable of a specific teacher across all their sections and courses.

**How it works:**

1. A searchable dropdown or search input shows all unique instructor names from the timetable data.
2. The student selects or types a teacher name.
3. The system shows all classes taught by that teacher in a weekly grid:
   - Rows = Days
   - Columns = Time slots
   - Each cell shows: course name, section, room
4. Below or alongside the grid, the teacher's directory information is shown: email, office room, office hours (pulled from the teacher file by name match).
5. If no teacher is selected, the view shows an empty state with a prompt to search.

---

### 4.4 Free Room Finder

**Purpose:** Allow a student to find which rooms are free at a specific day and time slot.

**How it works:**

1. The student selects:
   - **Day** — dropdown of all days present in the data (Monday through Saturday)
   - **Start Time** — the time from which they need the room
   - **End Time** — the time until which they need the room
2. The system computes which rooms are NOT occupied during any part of the selected time range on the selected day.
3. A room is considered occupied during a time range if any class uses it where the class time overlaps with the selected range (same overlap rule as 4.1).
4. The system shows two lists:
   - **Free Rooms** — rooms with no class during the selected range
   - **Occupied Rooms** — rooms that have at least one class during the range, with the class details shown (course, section, instructor, exact time)
5. If no day/time is selected yet, show an empty state with a prompt.
6. The result updates immediately when any of the three inputs change.

**Data note:**
- The full list of rooms is derived from the timetable data — all unique room values found in the `Room` column.
- Rooms that never appear on a given day are treated as free on that day.

---

### 4.5 Section Comparison

**Purpose:** Allow a student to compare two sections of the same course side by side to help choose between them.

**How it works:**

1. The student selects a **course name** from a dropdown of all unique course names in the data.
2. All sections offering that course are shown.
3. The student selects exactly **two sections** to compare.
4. A side-by-side comparison table is shown with these fields for each section:
   - Section label
   - Instructor name
   - Day(s)
   - Start time – End time
   - Room
   - Instructor email (from teacher file)
   - Instructor office hours (from teacher file)
5. If the selected course has only one section, a message is shown: "Only one section available for this course."
6. If the student selects more than two, the third selection replaces the second (always comparing the most recently selected pair).

---

### 4.6 Teacher Directory

**Purpose:** Allow a student to look up a teacher's contact and office information.

**How it works:**

1. A search input is shown. The student types any part of a teacher's name.
2. Results update as the student types (live search, no submit needed).
3. Each result card shows:
   - Full name
   - Email
   - Office Room
   - Office Hours
   - All courses currently taught by this teacher (pulled from timetable data): course name, section, day, time
4. If no results match the search, show "No teacher found."
5. If the search is empty, show all teachers listed alphabetically.

---

## 5. Navigation Structure

The application is a single-page application (SPA) or a multi-page app with a persistent top navigation bar.

The navigation must have these six items, each linking directly to the corresponding feature:

1. Clash Detector
2. Timetable Builder
3. Teacher Timetable
4. Free Room Finder
5. Section Comparison
6. Teacher Directory

There is no home/landing page required. The app can open directly on any one of the six features (Clash Detector is the default).

---

## 6. API Endpoints

The backend must expose the following REST API endpoints. The frontend consumes these endpoints.

### Data endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/courses` | Returns all course entries from timetable. Supports optional query param `?department=CS` or `?department=SE` to filter. |
| `GET` | `/api/teachers` | Returns all teachers from the teacher directory file with their full info. |
| `GET` | `/api/teacher/:name` | Returns one teacher's directory info + their timetable rows. Name is URL-encoded. |
| `GET` | `/api/sections` | Returns all unique sections with their department. |
| `GET` | `/api/rooms` | Returns all unique room names from the timetable data. |

### Feature endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/clash-check` | Body: `{ courses: [ {section, course, day, startTime, endTime} ] }`. Returns list of clashing pairs with clash details. |
| `GET` | `/api/free-rooms` | Query params: `?day=Monday&startTime=10:00&endTime=12:00`. Returns `{ freeRooms: [], occupiedRooms: [] }`. |
| `GET` | `/api/teacher-timetable/:name` | Returns the full weekly timetable for a teacher by name. |
| `GET` | `/api/course-sections/:courseName` | Returns all sections that offer the given course with full details. |

### Admin endpoint

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reload` | Re-reads both Excel files and refreshes in-memory data. Returns `{ success: true, counts: { courses, teachers } }`. |

---

## 7. Suggested Tech Stack

The AI agent may use any stack but the following is the intended direction for this project (student team familiar with these tools):

- **Backend:** Python with Flask or Django (Flask preferred for simplicity)
- **Excel parsing:** `openpyxl` or `pandas`
- **Frontend:** React (with plain CSS or Tailwind) or plain HTML/CSS/JavaScript
- **No database required** — all data lives in the Excel files and is loaded into memory at startup
- **No authentication library required** — the system is fully public

---

## 8. Data Integrity Rules

These rules apply throughout all features:

1. All name comparisons (instructor name lookup) must be **case-insensitive** and **whitespace-trimmed**.
2. All time comparisons must treat times as `HH:MM` 24-hour strings. Parse them correctly — do not do string comparison.
3. A course entry is uniquely identified by the combination of: `Section + Course + Day + Start Time`. There may be multiple rows with the same course name but different sections or days — they are separate entries.
4. Rooms are identified by their exact string value in the `Room` column (trimmed, case-preserved).
5. Days must be matched case-insensitively.
6. If the same instructor name appears with slightly different formatting in the timetable vs teacher file, the team is responsible for fixing the Excel file — the app does case-insensitive + trim matching only, not fuzzy matching.

---

## 9. Error Handling Requirements

- If the timetable file is missing: all timetable-dependent features show "Timetable data unavailable. Please contact TechNest."
- If the teacher file is missing: timetable features still work. Teacher directory fields show "Not available."
- If a POST `/api/reload` is called while files are missing: return `{ success: false, error: "File not found: timetable.xlsx" }` (or whichever file is missing).
- If a student submits an invalid time range (start time after end time) in Free Room Finder: return a validation error message, do not crash.
- All API errors must return JSON with a clear `error` field — never return an HTML error page from the API.

---

## 10. Out of Scope

The following are explicitly NOT part of this application:

- User login, registration, or any authentication
- Student saving or persisting their selected courses between sessions (no user accounts)
- Automatic timetable scraping from the university website
- Push notifications or alerts
- Admin dashboard UI (the reload endpoint is the only admin feature)
- Course registration or any integration with the university SIS portal
- Any data that is not in the two provided Excel files

---

*End of Functional Specification — TimetableIQ v1.0*
*Prepared by: Amir | TechNest, CUIATD*

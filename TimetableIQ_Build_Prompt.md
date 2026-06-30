# TimetableIQ — AI Agent Build Prompt

You are a senior full-stack software engineer. Your task is to build the complete TimetableIQ web application from scratch using two specification documents provided to you. Read both documents fully before writing a single line of code.

---

## Your Specification Documents

You have been given two files:

1. **TimetableIQ_Functional_Spec.md** — defines everything the system must DO: data sources, features, API endpoints, business logic, and error handling.
2. **TimetableIQ_Design_Spec.md** — defines everything the system must LOOK LIKE: design tokens, component rules, layouts, accessibility, and responsive behavior.

**These two documents are your single source of truth. Do not make assumptions. If a rule is in the spec, follow it exactly. If something is not in the spec, use your best judgment and note what decision you made.**

---

## What You Are Building

TimetableIQ is a browser-based web application for students of CUIATD (COMSATS University Islamabad, Abbottabad Campus). It reads university timetable data from two Excel files and gives students tools to plan their semester schedule without manual effort.

The application has six features:
1. Clash Detector
2. Personal Timetable Builder
3. Teacher Timetable View
4. Free Room Finder
5. Section Comparison
6. Teacher Directory

There is no login. No database. No authentication. The system is fully public.

---

## Technology Stack

Use exactly this stack. Do not substitute without a documented reason.

**Backend**
- Language: Python 3.10+
- Framework: Flask
- Excel parsing: `pandas` with `openpyxl` engine
- CORS: `flask-cors` (to allow frontend to call the API)

**Frontend**
- Framework: React (functional components with hooks)
- Styling: plain CSS (no Tailwind, no CSS-in-JS, no UI libraries)
- HTTP client: native `fetch` API
- PDF export: `jsPDF` + `html2canvas`
- Image export: `html2canvas`

**No database.** All data is loaded from the two Excel files into Python memory at startup.

**Project must run with two commands:**
```
# Terminal 1 — Backend
cd backend && pip install -r requirements.txt && python app.py

# Terminal 2 — Frontend
cd frontend && npm install && npm start
```

---

## Project Structure

Create this exact folder structure:

```
timetableiq/
├── backend/
│   ├── app.py                  # Flask app entry point
│   ├── data_loader.py          # Excel parsing and in-memory store
│   ├── clash.py                # Clash detection logic
│   ├── rooms.py                # Free room finder logic
│   ├── requirements.txt        # Python dependencies
│   └── data/
│       ├── timetable.xlsx      # Timetable data file (team places this here)
│       └── teachers.xlsx       # Teacher directory data file (team places this here)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── App.css             # Global styles and design tokens as CSS variables
│   │   ├── components/
│   │   │   ├── NavBar.js
│   │   │   ├── NavBar.css
│   │   │   ├── TimetableGrid.js
│   │   │   ├── TimetableGrid.css
│   │   │   ├── CourseTable.js
│   │   │   └── CourseTable.css
│   │   └── features/
│   │       ├── ClashDetector.js
│   │       ├── ClashDetector.css
│   │       ├── TimetableBuilder.js
│   │       ├── TimetableBuilder.css
│   │       ├── TeacherTimetable.js
│   │       ├── TeacherTimetable.css
│   │       ├── FreeRoomFinder.js
│   │       ├── FreeRoomFinder.css
│   │       ├── SectionComparison.js
│   │       ├── SectionComparison.css
│   │       ├── TeacherDirectory.js
│   │       └── TeacherDirectory.css
│   └── package.json
└── README.md
```

---

## Step-by-Step Build Order

Follow this exact order. Complete each step fully before moving to the next. Do not jump ahead.

---

### STEP 1 — Design Tokens (CSS Variables)

Before any component, open `frontend/src/App.css` and declare all design tokens from the Design Spec as CSS custom properties on the `:root` selector.

Every token from the Design Spec Section 2 must appear here. Example format:

```css
:root {
  /* Colors - Text */
  --color-text-primary: #555555;
  --color-text-secondary: #888888;
  /* ... all tokens ... */

  /* Typography */
  --font-family-primary: Helvetica, Arial, sans-serif;
  --font-size-sm: 11px;
  /* ... all tokens ... */

  /* Spacing */
  --space-1: 5px;
  /* ... all tokens ... */
}
```

**Rule: No component CSS file may ever use a raw hex color value or a raw pixel value for font size or spacing. Every value must reference a CSS variable defined here.**

---

### STEP 2 — Backend: Data Loader

Build `backend/data_loader.py`.

This module must:
- Read `data/timetable.xlsx` using pandas with `openpyxl` engine on startup.
- Read `data/teachers.xlsx` using pandas with `openpyxl` engine on startup.
- Parse the timetable sheet. Expected columns: `Department`, `Section`, `Day`, `Start Time`, `End Time`, `Course`, `Room`, `Instructor`. Skip empty rows.
- Parse the teachers sheet. Expected columns: `Name`, `Email`, `Office Room`, `Office Hours`.
- Store both datasets as Python lists of dicts in module-level variables: `COURSES` and `TEACHERS`.
- Expose a `reload()` function that re-reads both files and refreshes `COURSES` and `TEACHERS`.
- Strip whitespace from all string values when loading.
- Convert all time values to `HH:MM` 24-hour string format. Handle both `datetime.time` objects and plain strings.
- If a file is missing, log the error clearly and set the corresponding variable to an empty list. Do not crash.
- Join teacher info into courses: for each course row, look up the instructor name (case-insensitive, trimmed) in the teachers list and attach `email`, `office_room`, `office_hours` to the course dict. If no match, set those fields to `"Not available"`.

---

### STEP 3 — Backend: Clash Logic

Build `backend/clash.py`.

Expose one function:
```python
def find_clashes(selected_courses: list[dict]) -> list[dict]:
```

- `selected_courses` is a list of course dicts, each with keys: `section`, `course`, `day`, `start_time`, `end_time`.
- Compare every pair of courses.
- Two courses clash if they share the same `day` AND their time ranges overlap.
- Time overlap rule: `A.start_time < B.end_time AND A.end_time > B.start_time` — compare as `HH:MM` strings after converting to minutes-since-midnight integers for safe comparison.
- Return a list of clash dicts, each containing:
  ```python
  {
    "course_a": "...", "section_a": "...", "time_a": "HH:MM-HH:MM",
    "course_b": "...", "section_b": "...", "time_b": "HH:MM-HH:MM",
    "day": "..."
  }
  ```
- If no clashes, return an empty list.

---

### STEP 4 — Backend: Room Finder Logic

Build `backend/rooms.py`.

Expose one function:
```python
def find_free_rooms(day: str, start_time: str, end_time: str, courses: list[dict]) -> dict:
```

- `courses` is the full `COURSES` list from data_loader.
- Filter to courses that happen on the given `day` (case-insensitive).
- A room is OCCUPIED during the requested range if any class uses it where the class time overlaps with `[start_time, end_time]` using the same overlap rule as clash detection.
- All unique room values in the entire dataset are the universe of rooms.
- Return:
  ```python
  {
    "free_rooms": ["Room A", "Room B", ...],
    "occupied_rooms": [
      { "room": "...", "course": "...", "section": "...", "instructor": "...", "time": "HH:MM-HH:MM" },
      ...
    ]
  }
  ```

---

### STEP 5 — Backend: Flask API

Build `backend/app.py`.

- Initialize Flask and enable CORS for all routes.
- Import `data_loader`, `clash`, `rooms` modules.
- Call `data_loader.reload()` on startup.
- Implement all API endpoints exactly as defined in Section 6 of the Functional Spec.
- Every endpoint must return JSON. Never return HTML.
- Every error response must have this shape: `{"error": "description of problem"}` with an appropriate HTTP status code.
- Run on `http://localhost:5000`.

Endpoints to implement:

```
GET  /api/courses                      -> all courses, optional ?department=CS|SE filter
GET  /api/teachers                     -> all teachers from teacher file
GET  /api/teacher/<name>               -> one teacher's info + their timetable rows
GET  /api/sections                     -> all unique sections with department
GET  /api/rooms                        -> all unique room names
POST /api/clash-check                  -> body: {courses: [...]} -> clash results
GET  /api/free-rooms                   -> ?day=&startTime=&endTime= -> free/occupied rooms
GET  /api/teacher-timetable/<name>     -> weekly timetable for one teacher
GET  /api/course-sections/<courseName> -> all sections offering that course
POST /api/reload                       -> reload Excel files, return counts
```

---

### STEP 6 — Frontend: App Shell and Navigation

Build `frontend/src/App.js` and `frontend/src/components/NavBar.js`.

`App.js`:
- Use React Router (or a simple state-based router if React Router is not installed) to switch between the 6 feature views.
- Default view: Clash Detector.
- Pass the active feature name to NavBar.

`NavBar.js`:
- Render the top navigation bar exactly as described in Design Spec Section 4.
- Black background (`var(--color-surface-base)`).
- Logo "TimetableIQ" on the left.
- 6 nav items on the right.
- Active item has white text and a 2px white bottom border.
- Mobile hamburger menu collapses nav items below 640px.
- Hamburger toggles a visible/hidden mobile menu.
- All nav items must be keyboard accessible.

---

### STEP 7 — Frontend: Shared TimetableGrid Component

Build `frontend/src/components/TimetableGrid.js`.

This component receives:
```js
props: {
  courses: [],             // array of course objects to display
  highlightClashes: bool   // if true, clash cells get red styling
}
```

Rules (all from Design Spec Section 5):
- Render as a real HTML `<table>` element.
- Column headers = unique time slots sorted chronologically, format `HH:MM-HH:MM`.
- Row headers = days of week in order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
- Only include days that have at least one course in the data.
- Each populated cell shows: course name, room, instructor name as a blue link.
- Instructor name links have `aria-label="View timetable for [name]"`.
- If `highlightClashes` is true and a cell contains a clashing course, add clash styling (red background, "CLASH" label).
- The table wrapper div must have `overflow-x: auto` for horizontal scroll on mobile.
- The Day column must be `position: sticky; left: 0`.
- Use `<th scope="col">` for all time slot headers.
- Use `<th scope="row">` for all day row headers.
- No rounded corners on the table.
- Alternating row backgrounds.

---

### STEP 8 — Frontend: CourseTable Component

Build `frontend/src/components/CourseTable.js`.

Props:
```js
props: {
  courses: [],            // courses to display
  selectedCourses: [],    // currently selected course keys
  onToggle: fn            // called with course key when a row is checked/unchecked
}
```

Rules:
- Render as an HTML `<table>`.
- Columns: Checkbox | Course | Section | Department | Instructor | Day | Time | Room
- Each row has a checkbox. Clicking the entire row also toggles the checkbox.
- Selected rows have a blue left border and light blue background.
- Alternating row backgrounds on unselected rows.
- Table is horizontally scrollable on mobile.

---

### STEP 9 — Frontend: Clash Detector Feature

Build `frontend/src/features/ClashDetector.js`.

Behavior:
- Department filter at top: three options — All, CS, SE. Renders as a tab strip (three buttons side by side). "All" is default.
- Fetch courses from `/api/courses?department=X` when filter changes.
- Display courses in the CourseTable component.
- Maintain a `selectedCourses` state array.
- When `selectedCourses.length >= 2`, call `/api/clash-check` with the selected courses and display results.
- Results update every time a course is checked or unchecked (debounce 200ms).
- Clash results: each clash shown as a red left-bordered box with the clash description.
- No clashes: green text "No clashes detected among your selected courses."
- Less than 2 selected: show empty state message from Design Spec Section 9.

---

### STEP 10 — Frontend: Timetable Builder Feature

Build `frontend/src/features/TimetableBuilder.js`.

Behavior:
- Department filter (same tab strip as Clash Detector).
- CourseTable for course selection.
- "Build Timetable" primary button — disabled until at least 1 course selected.
- On click, generates the timetable grid from selected courses using TimetableGrid component.
- If any clashes exist in selection, show warning banner above the grid.
- "Export as PDF" and "Save as Image" secondary buttons appear below the grid.
  - PDF export: use `jsPDF` + `html2canvas` to capture the timetable grid div and save as PDF.
  - Image export: use `html2canvas` to capture the timetable grid div and trigger a PNG download.
  - Exported file name format: `TimetableIQ_My_Timetable.pdf` / `.png`

---

### STEP 11 — Frontend: Teacher Timetable View Feature

Build `frontend/src/features/TeacherTimetable.js`.

Behavior:
- Fetch all teachers from `/api/teachers` on mount.
- Render a searchable dropdown (text input + filtered suggestion list) for teacher selection.
- When teacher is selected, fetch `/api/teacher-timetable/<name>`.
- Show Teacher Info Bar (name, email as link, office room, office hours) per Design Spec 7.3.
- Show TimetableGrid with that teacher's courses.
- If no teacher selected: show empty state message.

---

### STEP 12 — Frontend: Free Room Finder Feature

Build `frontend/src/features/FreeRoomFinder.js`.

Behavior:
- Fetch available days and times from `/api/courses` on mount to populate dropdowns dynamically.
- Three dropdowns: Day, Start Time, End Time — all populated from actual data, not hardcoded.
- Time dropdowns show all unique start/end times from the dataset in sorted HH:MM order.
- Validate that Start Time < End Time — show inline error if not.
- When all three are selected and valid, call `/api/free-rooms?day=&startTime=&endTime=`.
- Show two columns: Free Rooms (green header) and Occupied Rooms (red header) per Design Spec 7.4.
- Results update immediately on any dropdown change.

---

### STEP 13 — Frontend: Section Comparison Feature

Build `frontend/src/features/SectionComparison.js`.

Behavior:
- Fetch all unique course names from `/api/courses` for the course dropdown.
- When course is selected, fetch `/api/course-sections/<courseName>`.
- Show available sections as checkboxes. Allow max 2 selections — third replaces second.
- When exactly 2 are selected, render the comparison table per Design Spec 7.5.
- If only 1 section exists for the chosen course, show the "only one section" message.
- Email fields render as anchor links.

---

### STEP 14 — Frontend: Teacher Directory Feature

Build `frontend/src/features/TeacherDirectory.js`.

Behavior:
- Fetch all teachers from `/api/teachers` on mount.
- Render a search input at the top with placeholder "Search by teacher name..."
- On mount (empty search): show all teachers sorted A-Z as cards.
- As user types, filter teachers by name (case-insensitive substring match).
- Each teacher card follows Design Spec 7.6 exactly: name, email link, office room, office hours, divider, courses taught.
- Courses taught: cross-reference by instructor name from the full course list.
- Grid: 1 column mobile, 2 columns tablet, 3 columns desktop.
- No results: show empty state message.

---

### STEP 15 — README

Write `README.md` with:

1. Project overview — one paragraph.
2. Setup instructions — exact commands to install and run backend and frontend.
3. How to update timetable data — replace the two Excel files in `backend/data/`, then call `POST /api/reload` or restart the server.
4. Excel file format — exact column names required in each file.
5. Feature list — one line per feature.
6. Tech stack — list.

---

## Rules You Must Follow Throughout

1. **Read both spec files first.** Do not start coding until you have read both files completely.

2. **No CSS raw values.** Every color, font size, and spacing value in any `.css` file must use a CSS variable. If you catch yourself typing `#555555` or `11px` directly — stop and use the variable.

3. **No login, no auth.** If you find yourself writing any login form, session handling, token storage, or protected route — delete it. The entire app is public.

4. **No database.** If you find yourself writing SQL, installing SQLAlchemy, or creating migration files — stop. All data comes from the two Excel files loaded into Python memory.

5. **Real HTML tables for timetables.** Do not render timetable grids as CSS grid or flexbox div layouts. They must be `<table>` elements with proper `scope` attributes.

6. **Mobile-first CSS.** Write base styles for mobile first, then use `@media (min-width: 640px)` and `@media (min-width: 1024px)` for larger screens.

7. **Test each step before moving to the next.** After finishing each step, verify it works before continuing.

8. **Keep feature files independent.** Each feature component must only import from `components/` and make its own API calls. Features must not import from each other.

9. **Handle missing data gracefully.** If an API call fails or returns empty data, every feature must show a meaningful error or empty state — never a blank screen or a JavaScript crash.

10. **Commit-ready code.** Write clean, readable code with comments on non-obvious logic. Use meaningful variable names. No dead code.

---

## Sample Excel File Formats

Use these sample rows to create test Excel files for local development.

**timetable.xlsx:**
```
Department | Section | Day       | Start Time | End Time | Course              | Room    | Instructor
CS         | CS-3A   | Monday    | 08:00      | 09:30    | Data Structures     | CS-101  | Dr. Ahmed Khan
CS         | CS-3A   | Wednesday | 11:00      | 12:30    | Operating Systems   | CS-102  | Dr. Sara Malik
CS         | CS-3B   | Monday    | 08:00      | 09:30    | Data Structures     | CS-103  | Dr. Usman Ali
SE         | SE-2A   | Tuesday   | 09:30      | 11:00    | Software Engineering| SE-201  | Dr. Nadia Hassan
SE         | SE-2A   | Thursday  | 14:30      | 16:00    | Database Systems    | CS-101  | Dr. Ahmed Khan
```

**teachers.xlsx:**
```
Name             | Email                         | Office Room | Office Hours
Dr. Ahmed Khan   | ahmed.khan@cuiatd.edu.pk      | F-201       | Mon 10:00-12:00, Wed 14:00-16:00
Dr. Sara Malik   | sara.malik@cuiatd.edu.pk      | F-202       | Tue 11:00-13:00
Dr. Usman Ali    | usman.ali@cuiatd.edu.pk       | F-203       | Thu 9:00-11:00
Dr. Nadia Hassan | nadia.hassan@cuiatd.edu.pk    | F-204       | Mon 14:00-16:00
```

---

## Definition of Done

The build is complete when all of the following are true:

- [ ] Backend starts without errors when both Excel files are present.
- [ ] Backend starts without crashing when one or both Excel files are missing.
- [ ] All 10 API endpoints return correct JSON responses.
- [ ] `POST /api/reload` re-reads both files and returns updated counts.
- [ ] Frontend starts and displays the navigation bar with all 6 items.
- [ ] All 6 features render without JavaScript errors.
- [ ] Clash Detector correctly detects and displays clashing course pairs in real time.
- [ ] Timetable Builder generates a grid matching the CUIATD timetable visual style.
- [ ] PDF and image export produce downloadable files containing the timetable grid.
- [ ] Teacher Timetable View shows a teacher's full weekly schedule with their directory info.
- [ ] Free Room Finder returns correct free and occupied rooms for a given day and time range.
- [ ] Section Comparison shows a correct side-by-side table for two sections.
- [ ] Teacher Directory shows all teachers on load and filters correctly as user types.
- [ ] Application is fully usable on a 375px wide mobile screen.
- [ ] No raw hex values or raw pixel values exist in any component CSS file.
- [ ] All timetable grids are rendered as `<table>` elements with `scope` attributes.
- [ ] All interactive elements have visible focus indicators.
- [ ] No login screen exists anywhere in the application.

---

*TimetableIQ Build Prompt v1.0*
*TechNest — CUIATD*

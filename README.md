# TimetableIQ

TimetableIQ is a browser-based web application for students of CUIATD (COMSATS University Islamabad, Abbottabad Campus). It reads university timetable and teacher directory data from two Excel files and provides six powerful tools that make semester planning fast and accurate — with no login, no database, and no manual effort.

---

## Setup & Running

### Backend (Python/Flask)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend API runs on `http://localhost:5000`.

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000` and proxies API calls to the backend automatically.

---

## How to Update Timetable Data

1. Replace the Excel files in `backend/data/`:
   - `timetable.xlsx` — class schedule data
   - `teachers.xlsx` — teacher directory data
2. Either restart the backend server, **or** call the reload endpoint:
   ```
   POST http://localhost:5000/api/reload
   ```
   This re-reads both files without restarting.

---

## Excel File Format

### timetable.xlsx

| Column | Description |
|--------|-------------|
| `Department` | `CS` or `SE` |
| `Section` | e.g. `CS-3A`, `SE-2B` |
| `Day` | e.g. `Monday`, `Tuesday` |
| `Start Time` | 24-hour time, e.g. `08:00` |
| `End Time` | 24-hour time, e.g. `09:30` |
| `Course` | Full course name |
| `Room` | Room identifier, e.g. `CS-101` |
| `Instructor` | Full name, e.g. `Dr. Ahmed Khan` |

### teachers.xlsx

| Column | Description |
|--------|-------------|
| `Name` | Must match `Instructor` column in timetable (case-insensitive) |
| `Email` | University email address |
| `Office Room` | Room number/label |
| `Office Hours` | Text description of available hours |

---

## Features

1. **Clash Detector** — Select multiple courses and instantly detect scheduling conflicts in real time.
2. **Timetable Builder** — Build your personal weekly timetable from selected courses with PDF/PNG export.
3. **Teacher Timetable** — View any teacher's full weekly schedule with contact info.
4. **Free Room Finder** — Find which rooms are free or occupied for a specific day and time slot.
5. **Section Comparison** — Compare two sections of the same course side by side.
6. **Teacher Directory** — Search and browse all teachers with their contact and office information.

---

## Tech Stack

- **Backend:** Python 3.10+, Flask, pandas, openpyxl, flask-cors
- **Frontend:** React 18, plain CSS, native fetch API
- **Export:** jsPDF + html2canvas
- **Data:** Two Excel files loaded into Python memory at startup — no database

---

*TimetableIQ v1.0 — Built by TechNest, CUIATD*

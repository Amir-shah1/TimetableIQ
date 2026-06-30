"""
data_loader.py — TimetableIQ Backend
Reads timetable.xlsx and teachers.xlsx into memory on startup.
Exposes COURSES and TEACHERS as module-level lists of dicts.
"""

import os
import logging
import datetime

import pandas as pd

logger = logging.getLogger(__name__)

# Paths relative to this file's location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
TIMETABLE_PATH = os.path.join(DATA_DIR, "timetable.xlsx")
TEACHERS_PATH = os.path.join(DATA_DIR, "teachers.xlsx")

# Module-level in-memory stores
COURSES: list[dict] = []
TEACHERS: list[dict] = []


def _to_hhmm(value) -> str:
    """Convert a time value (datetime.time, string, or similar) to HH:MM 24-hour string."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "00:00"
    if isinstance(value, datetime.time):
        return value.strftime("%H:%M")
    if isinstance(value, datetime.datetime):
        return value.strftime("%H:%M")
    s = str(value).strip()
    # Already in HH:MM format
    if len(s) == 5 and s[2] == ":":
        return s
    # Could be H:MM
    if len(s) == 4 and s[1] == ":":
        return "0" + s
    # pandas Timedelta or other — try to parse
    try:
        t = pd.to_datetime(s).time()
        return t.strftime("%H:%M")
    except Exception:
        pass
    return s


def _strip(value) -> str:
    """Strip whitespace from a value, coercing to string."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    return str(value).strip()


def _load_teachers() -> list[dict]:
    """Load teachers.xlsx into a list of dicts."""
    if not os.path.exists(TEACHERS_PATH):
        logger.error("Teachers file not found: %s", TEACHERS_PATH)
        return []
    try:
        df = pd.read_excel(TEACHERS_PATH, engine="openpyxl")
        df.columns = [str(c).strip() for c in df.columns]
        teachers = []
        for _, row in df.iterrows():
            name = _strip(row.get("Name", ""))
            if not name:
                continue  # skip empty rows
            teachers.append(
                {
                    "name": name,
                    "email": _strip(row.get("Email", "Not available")),
                    "office_room": _strip(row.get("Office Room", "Not available")),
                    "office_hours": _strip(row.get("Office Hours", "Not available")),
                }
            )
        logger.info("Loaded %d teachers from %s", len(teachers), TEACHERS_PATH)
        return teachers
    except Exception as exc:
        logger.error("Failed to load teachers file: %s", exc)
        return []


def _load_courses(teachers: list[dict]) -> list[dict]:
    """Load timetable.xlsx into a list of dicts, joining teacher info."""
    if not os.path.exists(TIMETABLE_PATH):
        logger.error("Timetable file not found: %s", TIMETABLE_PATH)
        return []
    try:
        df = pd.read_excel(TIMETABLE_PATH, engine="openpyxl")
        df.columns = [str(c).strip() for c in df.columns]

        # Build a case-insensitive lookup map: name.lower() -> teacher dict
        teacher_map = {t["name"].lower(): t for t in teachers}

        courses = []
        import re
        def generate_email(name):
            if not name: return "Not available"
            clean = re.sub(r'(?i)^dr\.?\s*', '', name)
            clean = re.sub(r'[^a-zA-Z0-9]', '', clean).lower()
            return f"{clean}@cuiatd.edu.pk" if clean else "Not available"

        for _, row in df.iterrows():
            # Skip rows where required fields are empty
            course_name = _strip(row.get("Course", ""))
            if not course_name:
                continue
            
            # Normalize lab course names to the base course name
            course_name = re.sub(r'(?i)\s*\(.*?lab.*?\)', '', course_name).strip()

            instructor = _strip(row.get("Instructor", ""))
            teacher_info = teacher_map.get(instructor.lower(), {})

            courses.append(
                {
                    "department": _strip(row.get("Department", "")),
                    "section": _strip(row.get("Section", "")),
                    "day": _strip(row.get("Day", "")),
                    "start_time": _to_hhmm(row.get("Start Time", "")),
                    "end_time": _to_hhmm(row.get("End Time", "")),
                    "course": course_name,
                    "room": _strip(row.get("Room", "")),
                    "instructor": instructor,
                    # Joined teacher fields
                    "email": generate_email(instructor),
                    "office_room": teacher_info.get("office_room", "Not available"),
                    "office_hours": teacher_info.get("office_hours", "Not available"),
                }
            )
        logger.info("Loaded %d course rows from %s", len(courses), TIMETABLE_PATH)
        return courses
    except Exception as exc:
        logger.error("Failed to load timetable file: %s", exc)
        return []


def reload():
    """Re-read both Excel files and refresh in-memory COURSES and TEACHERS."""
    global COURSES, TEACHERS
    TEACHERS = _load_teachers()
    COURSES = _load_courses(TEACHERS)
    logger.info(
        "Data reload complete — %d courses, %d teachers", len(COURSES), len(TEACHERS)
    )

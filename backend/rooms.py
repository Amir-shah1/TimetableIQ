"""
rooms.py — TimetableIQ Backend
Free room finder logic: given a day and time range, return free and occupied rooms.
"""


def _to_minutes(hhmm: str) -> int:
    """Convert HH:MM string to total minutes since midnight."""
    try:
        parts = hhmm.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except (ValueError, IndexError):
        return 0


def find_free_rooms(
    day: str, start_time: str, end_time: str, courses: list[dict]
) -> dict:
    """
    Find free and occupied rooms for a given day and time range.

    A room is OCCUPIED if any class on that day overlaps with [start_time, end_time]:
        class.start < end_time AND class.end > start_time

    All unique rooms in the entire dataset are the universe.

    Args:
        day: Day string e.g. "Monday"
        start_time: HH:MM string
        end_time: HH:MM string
        courses: full COURSES list from data_loader

    Returns:
        {
            "free_rooms": ["Room A", ...],
            "occupied_rooms": [
                {"room": ..., "course": ..., "section": ..., "instructor": ..., "time": ...},
                ...
            ]
        }
    """
    req_start = _to_minutes(start_time)
    req_end = _to_minutes(end_time)

    # Universe: all unique rooms in the entire dataset
    all_rooms = sorted({c["room"] for c in courses if c.get("room")})

    # Filter courses that happen on the requested day (case-insensitive)
    day_courses = [c for c in courses if c.get("day", "").lower() == day.lower()]

    occupied_rooms: dict[str, list] = {}  # room -> list of occupying class details

    for course in day_courses:
        c_start = _to_minutes(course.get("start_time", "00:00"))
        c_end = _to_minutes(course.get("end_time", "00:00"))

        # Overlap check
        if c_start < req_end and c_end > req_start:
            room = course.get("room", "")
            if not room:
                continue
            if room not in occupied_rooms:
                occupied_rooms[room] = []
            occupied_rooms[room].append(
                {
                    "room": room,
                    "course": course.get("course", ""),
                    "section": course.get("section", ""),
                    "instructor": course.get("instructor", ""),
                    "time": f"{course.get('start_time', '')}–{course.get('end_time', '')}",
                }
            )

    free_rooms = sorted([r for r in all_rooms if r not in occupied_rooms])

    # Flatten occupied room entries (one entry per class, not per room)
    occupied_list = []
    for room in sorted(occupied_rooms.keys()):
        occupied_list.extend(occupied_rooms[room])

    return {
        "free_rooms": free_rooms,
        "occupied_rooms": occupied_list,
    }

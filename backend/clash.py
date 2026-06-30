"""
clash.py — TimetableIQ Backend
Clash detection logic: given a list of selected course dicts, find all time-overlapping pairs.
"""


def _to_minutes(hhmm: str) -> int:
    """Convert HH:MM string to total minutes since midnight."""
    try:
        parts = hhmm.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except (ValueError, IndexError):
        return 0


def find_clashes(selected_courses: list[dict]) -> list[dict]:
    """
    Given a list of course dicts, return all clashing pairs.

    Two courses clash if they share the same day AND their time ranges overlap:
        A.start_time < B.end_time AND A.end_time > B.start_time

    Args:
        selected_courses: list of dicts with keys:
            section, course, day, start_time, end_time

    Returns:
        list of clash dicts:
            {course_a, section_a, time_a, course_b, section_b, time_b, day}
    """
    clashes = []
    n = len(selected_courses)

    for i in range(n):
        for j in range(i + 1, n):
            a = selected_courses[i]
            b = selected_courses[j]

            # Must share the same day (case-insensitive)
            if a.get("day", "").lower() != b.get("day", "").lower():
                continue

            a_start = _to_minutes(a.get("start_time", "00:00"))
            a_end = _to_minutes(a.get("end_time", "00:00"))
            b_start = _to_minutes(b.get("start_time", "00:00"))
            b_end = _to_minutes(b.get("end_time", "00:00"))

            # Standard overlap check
            if a_start < b_end and a_end > b_start:
                clashes.append(
                    {
                        "course_a": a.get("course", ""),
                        "section_a": a.get("section", ""),
                        "time_a": f"{a.get('start_time', '')}–{a.get('end_time', '')}",
                        "course_b": b.get("course", ""),
                        "section_b": b.get("section", ""),
                        "time_b": f"{b.get('start_time', '')}–{b.get('end_time', '')}",
                        "day": a.get("day", ""),
                    }
                )

    return clashes

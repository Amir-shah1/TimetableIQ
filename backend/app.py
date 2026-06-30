"""
app.py — TimetableIQ Backend
Flask API entry point. All 10 endpoints defined here.
Run: python app.py
"""

import logging
import os
from urllib.parse import unquote

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

import data_loader
import clash as clash_module
import rooms as rooms_module

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Serve React App
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)  # Allow all origins for local development

# Load data on startup
data_loader.reload()


# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────

def error(msg: str, status: int = 400):
    return jsonify({"error": msg}), status


# ─────────────────────────────────────────────
# Data Endpoints
# ─────────────────────────────────────────────

@app.route("/api/courses", methods=["GET"])
def get_courses():
    """GET /api/courses — returns all course entries, optional ?department=CS|SE filter."""
    dept = request.args.get("department", "").strip().upper()
    courses = data_loader.COURSES
    if dept == "CS":
        courses = [c for c in courses if c.get("department", "").upper() in ("CS", "COMPUTER SCIENCE")]
    elif dept == "SE":
        courses = [c for c in courses if c.get("department", "").upper() in ("SE", "SOFTWARE ENGINEERING")]
    return jsonify(courses)


@app.route("/api/teachers", methods=["GET"])
def get_teachers():
    """GET /api/teachers — returns all teachers from the timetable data."""
    seen = {}
    for c in data_loader.COURSES:
        name = c.get("instructor")
        if name and name not in seen:
            seen[name] = {
                "name": name,
                "email": c.get("email", ""),
                "office_room": c.get("office_room", ""),
                "office_hours": c.get("office_hours", "")
            }
    return jsonify(sorted(seen.values(), key=lambda x: x["name"]))


@app.route("/api/teacher/<path:name>", methods=["GET"])
def get_teacher(name: str):
    """GET /api/teacher/<name> — one teacher's info + their timetable rows."""
    name = unquote(name).strip()
    name_lower = name.lower()

    teacher = next(
        (t for t in data_loader.TEACHERS if t["name"].lower() == name_lower), None
    )

    timetable_rows = [
        c for c in data_loader.COURSES if c.get("instructor", "").lower() == name_lower
    ]

    if teacher is None and not timetable_rows:
        return error(f"Teacher '{name}' not found.", 404)

    result = teacher.copy() if teacher else {"name": name}
    result["timetable"] = timetable_rows
    return jsonify(result)


@app.route("/api/sections", methods=["GET"])
def get_sections():
    """GET /api/sections — all unique sections with department."""
    seen = {}
    for c in data_loader.COURSES:
        key = c.get("section", "")
        if key and key not in seen:
            seen[key] = {"section": key, "department": c.get("department", "")}
    return jsonify(sorted(seen.values(), key=lambda x: x["section"]))


@app.route("/api/rooms", methods=["GET"])
def get_rooms():
    """GET /api/rooms — all unique room names from the timetable data."""
    rooms = sorted({c.get("room", "") for c in data_loader.COURSES if c.get("room")})
    return jsonify(rooms)


# ─────────────────────────────────────────────
# Feature Endpoints
# ─────────────────────────────────────────────

@app.route("/api/clash-check", methods=["POST"])
def clash_check():
    """POST /api/clash-check — body: {courses: [...]} — returns clash results."""
    body = request.get_json(silent=True)
    if not body or "courses" not in body:
        return error("Request body must contain a 'courses' array.")
    selected = body["courses"]
    if not isinstance(selected, list):
        return error("'courses' must be an array.")
    clashes = clash_module.find_clashes(selected)
    return jsonify({"clashes": clashes})


@app.route("/api/free-rooms", methods=["GET"])
def free_rooms():
    """GET /api/free-rooms?day=&startTime=&endTime= — free and occupied rooms."""
    day = request.args.get("day", "").strip()
    start_time = request.args.get("startTime", "").strip()
    end_time = request.args.get("endTime", "").strip()

    if not day or not start_time or not end_time:
        return error("Query params 'day', 'startTime', and 'endTime' are required.")

    # Validate time order
    def to_min(t):
        try:
            h, m = t.split(":")
            return int(h) * 60 + int(m)
        except Exception:
            return 0

    if to_min(start_time) >= to_min(end_time):
        return error("startTime must be before endTime.")

    result = rooms_module.find_free_rooms(day, start_time, end_time, data_loader.COURSES)
    return jsonify(result)


@app.route("/api/teacher-timetable/<path:name>", methods=["GET"])
def teacher_timetable(name: str):
    """GET /api/teacher-timetable/<name> — weekly timetable for one teacher."""
    name = unquote(name).strip()
    name_lower = name.lower()
    rows = [
        c for c in data_loader.COURSES if c.get("instructor", "").lower() == name_lower
    ]
    if not rows:
        return error(f"No timetable found for teacher '{name}'.", 404)
    return jsonify(rows)


@app.route("/api/course-sections/<path:course_name>", methods=["GET"])
def course_sections(course_name: str):
    """GET /api/course-sections/<courseName> — all sections offering that course."""
    course_name = unquote(course_name).strip()
    course_lower = course_name.lower()
    rows = [
        c for c in data_loader.COURSES if c.get("course", "").lower() == course_lower
    ]
    if not rows:
        return error(f"No sections found for course '{course_name}'.", 404)
    return jsonify(rows)


# ─────────────────────────────────────────────
# Admin Endpoint
# ─────────────────────────────────────────────

@app.route("/api/reload", methods=["POST"])
def reload_data():
    """POST /api/reload — re-read Excel files and refresh in-memory data."""
    try:
        data_loader.reload()
        return jsonify(
            {
                "success": True,
                "counts": {
                    "courses": len(data_loader.COURSES),
                    "teachers": len(data_loader.TEACHERS),
                },
            }
        )
    except Exception as exc:
        logger.error("Reload failed: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


# ─────────────────────────────────────────────
# Frontend Serving Routes
# ─────────────────────────────────────────────

@app.route("/", defaults={'path': ''})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(app.static_folder, 'index.html')

# ─────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

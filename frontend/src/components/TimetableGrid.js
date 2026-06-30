import React from 'react';
import './TimetableGrid.css';

/**
 * TimetableGrid — renders a weekly timetable as a proper HTML <table>.
 *
 * Props:
 *   courses         — array of course objects to display
 *   highlightClashes — if true, clash cells get red styling
 *   onInstructorClick — optional callback(instructorName)
 */

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function TimetableGrid({ courses = [], highlightClashes = false, onInstructorClick }) {
  if (!courses.length) return null;

  // Collect unique time slots, sorted
  const timeSlotSet = new Set();
  courses.forEach(c => {
    const slot = `${c.start_time}–${c.end_time}`;
    timeSlotSet.add(slot);
  });
  const timeSlots = [...timeSlotSet].sort((a, b) => {
    const [aStart] = a.split('–');
    const [bStart] = b.split('–');
    return timeToMinutes(aStart) - timeToMinutes(bStart);
  });

  // Collect unique days present, sorted by DAY_ORDER
  const daysPresent = DAY_ORDER.filter(day =>
    courses.some(c => c.day?.toLowerCase() === day.toLowerCase())
  );

  // Build cell lookup: [day][timeSlot] = array of courses
  const cellMap = {};
  daysPresent.forEach(day => { cellMap[day] = {}; });
  courses.forEach(c => {
    const dayKey = DAY_ORDER.find(d => d.toLowerCase() === c.day?.toLowerCase());
    if (!dayKey) return;
    const slot = `${c.start_time}–${c.end_time}`;
    if (!cellMap[dayKey][slot]) cellMap[dayKey][slot] = [];
    cellMap[dayKey][slot].push(c);
  });

  // Determine clashing courses (simple: count > 1 in a cell, or use clash prop)
  const isClashCell = (dayCourses) => highlightClashes && dayCourses && dayCourses.length > 1;

  return (
    <div className="timetable-scroll-wrapper">
      <table className="timetable-table" role="grid" aria-label="Weekly timetable">
        <thead>
          <tr>
            <th scope="col" className="timetable-day-header">Day</th>
            {timeSlots.map(slot => (
              <th key={slot} scope="col" className="timetable-time-header">{slot}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daysPresent.map((day, rowIdx) => (
            <tr key={day} className={rowIdx % 2 === 0 ? 'row-odd' : 'row-even'}>
              <th scope="row" className="timetable-day-cell">{day}</th>
              {timeSlots.map(slot => {
                const cellCourses = cellMap[day][slot] || [];
                const isClash = isClashCell(cellCourses);
                return (
                  <td
                    key={slot}
                    className={`timetable-cell${isClash ? ' timetable-cell-clash' : ''}`}
                  >
                    {cellCourses.map((c, i) => (
                      <div key={i} className="cell-entry">
                        {isClash && (
                          <span className="clash-label">CLASH</span>
                        )}
                        <div className="cell-course">{c.course}</div>
                        <div className="cell-room">{c.room}</div>
                        {onInstructorClick ? (
                          <button
                            className="cell-instructor-btn"
                            onClick={() => onInstructorClick(c.instructor)}
                            aria-label={`View timetable for ${c.instructor}`}
                          >
                            {c.instructor}
                          </button>
                        ) : (
                          <span
                            className="cell-instructor"
                            aria-label={`Instructor: ${c.instructor}`}
                          >
                            {c.instructor}
                          </span>
                        )}
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimetableGrid;

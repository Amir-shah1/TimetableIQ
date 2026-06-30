import React from 'react';
import './CourseTable.css';

/**
 * CourseTable — renders a selectable list of courses as an HTML table.
 *
 * Props:
 *   courses         — array of course objects
 *   selectedKeys    — Set of selected course keys
 *   onToggle        — fn(key) called when a row is toggled
 */

function courseKey(c) {
  return `${c.section}||${c.course}||${c.day}||${c.start_time}`;
}

function CourseTable({ courses = [], selectedKeys = new Set(), onToggle, compact = false, getCourseKey = courseKey }) {
  if (!courses.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-heading">No courses found</div>
        <div className="empty-state-subtext">Timetable data may be unavailable.</div>
      </div>
    );
  }

  return (
    <div className="course-table-wrapper">
      <table className="course-table" aria-label="Course selection table">
        <thead>
          <tr>
            <th scope="col" className="col-check" aria-label="Select"></th>
            <th scope="col">Course</th>
            <th scope="col">Section</th>
            <th scope="col">Dept</th>
            <th scope="col">Instructor</th>
            {!compact && <th scope="col">Day</th>}
            {!compact && <th scope="col">Time</th>}
            {!compact && <th scope="col">Room</th>}
          </tr>
        </thead>
        <tbody>
          {courses.map((c, idx) => {
            const key = getCourseKey(c);
            const isSelected = selectedKeys.has(key);
            return (
              <tr
                key={key}
                className={`course-row${isSelected ? ' selected' : ''} ${idx % 2 === 0 ? 'row-odd' : 'row-even'}`}
                onClick={() => onToggle(key, c)}
                style={{ cursor: 'pointer' }}
                aria-selected={isSelected}
              >
                <td className="col-check">
                  <input
                    type="checkbox"
                    id={`course-check-${key}`}
                    checked={isSelected}
                    onChange={() => onToggle(key, c)}
                    onClick={e => e.stopPropagation()}
                    aria-label={`Select ${c.course} - ${c.section}`}
                  />
                </td>
                <td><label htmlFor={`course-check-${key}`} style={{ cursor: 'pointer' }}>{c.course}</label></td>
                <td>{c.section}</td>
                <td>
                  <span className={`tag tag-${(c.department || '').toLowerCase().includes('computer science') || (c.department || '').toLowerCase() === 'cs' ? 'cs' : (c.department || '').toLowerCase().includes('software engineering') || (c.department || '').toLowerCase() === 'se' ? 'se' : (c.department || '').toLowerCase()}`}>
                    {c.department}
                  </span>
                </td>
                <td>{c.instructor}</td>
                {!compact && <td>{c.day}</td>}
                {!compact && <td>{c.start_time} – {c.end_time}</td>}
                {!compact && <td>{c.room}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { courseKey };
export default CourseTable;

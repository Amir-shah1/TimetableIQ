import React, { useState, useEffect, useMemo } from 'react';
import './TeacherDirectory.css';

function TeacherDirectory() {
  const [teachers, setTeachers]   = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [query, setQuery]         = useState('');
  const [error, setError]         = useState('');

  // Fetch teachers and courses on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/teachers').then(r => r.json()),
      fetch('/api/courses').then(r => r.json()),
    ])
      .then(([t, c]) => {
        if (Array.isArray(t)) setTeachers(t);
        else setError('Timetable data is currently unavailable. Please contact TechNest.');
        if (Array.isArray(c)) setAllCourses(c);
      })
      .catch(() => setError('Timetable data is currently unavailable. Please contact TechNest.'));
  }, []);

  // Filter teachers by search query, sorted A-Z
  const filtered = useMemo(() => {
    const sorted = [...teachers].sort((a, b) => a.name.localeCompare(b.name));
    if (!query.trim()) return sorted;
    return sorted.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  }, [teachers, query]);

  // Get courses taught by a teacher
  const getCourses = (teacherName) => {
    const taught = allCourses.filter(
      c => c.instructor.toLowerCase() === teacherName.toLowerCase()
    );
    const unique = [];
    const seen = new Set();
    for (const c of taught) {
      const key = `${c.course}||${c.section}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    return unique;
  };

  return (
    <div className="feature-page container">
      <h1 className="feature-heading">Teacher Directory</h1>
      <p className="feature-subheading">Search for any teacher to view their contact info and schedule.</p>

      {error && <div className="error-msg">{error}</div>}

      {/* Search input */}
      <div className="dir-search-wrapper">
        <label className="input-label" htmlFor="teacher-dir-search">Search Teachers</label>
        <input
          id="teacher-dir-search"
          type="text"
          className="input-field"
          placeholder="Search by teacher name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search teacher directory"
        />
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="empty-state section-gap">
          <div className="empty-state-icon">🔎</div>
          <div className="empty-state-heading">No teacher found matching your search.</div>
        </div>
      )}

      {/* Teacher cards grid */}
      {filtered.length > 0 && (
        <div className="teacher-grid">
          {filtered.map(teacher => {
            const courses = getCourses(teacher.name);
            return (
              <div key={teacher.name} className="teacher-card card" aria-label={`Teacher card for ${teacher.name}`}>
                <div className="card-title teacher-name">{teacher.name}</div>
                <div className="teacher-email">
                  <a href={`mailto:${teacher.email}`} aria-label={`Email ${teacher.name}`}>
                    {teacher.email}
                  </a>
                </div>
                <div className="teacher-meta">
                  <span className="meta-label">Office:</span>{' '}
                  <span className="meta-value">{teacher.office_room}</span>
                </div>
                <div className="teacher-meta">
                  <span className="meta-label">Hours:</span>{' '}
                  <span className="meta-value">{teacher.office_hours}</span>
                </div>
                <hr className="card-divider" />
                <div className="courses-section">
                  <div className="courses-heading">Courses Taught</div>
                  {courses.length === 0 ? (
                    <div className="no-courses-text">No courses in timetable.</div>
                  ) : (
                    <ul className="courses-list">
                      {courses.map((c, i) => (
                        <li key={i} className="course-entry">
                          {c.course} — {c.section}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeacherDirectory;

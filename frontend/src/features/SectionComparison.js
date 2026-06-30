import React, { useState, useEffect } from 'react';
import './SectionComparison.css';

function SectionComparison() {
  const [courses, setCourses]       = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sections, setSections]     = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [loadingS, setLoadingS]     = useState(false);
  const [error, setError]           = useState('');

  // Load all unique course names on mount
  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setError('Timetable data is currently unavailable. Please contact TechNest.'); return; }
        const names = [...new Set(data.map(c => c.course))].sort();
        setCourses(names);
      })
      .catch(() => setError('Timetable data is currently unavailable. Please contact TechNest.'));
  }, []);

  // Fetch sections when course changes
  useEffect(() => {
    if (!selectedCourse) { setSections([]); setSelectedSections([]); return; }
    setLoadingS(true);
    setSelectedSections([]);
    fetch(`/api/course-sections/${encodeURIComponent(selectedCourse)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSections(data);
        else { setError(data.error || 'Error loading sections.'); setSections([]); }
        setLoadingS(false);
      })
      .catch(() => { setError('Error loading sections.'); setLoadingS(false); });
  }, [selectedCourse]);

  const toggleSection = (section) => {
    setSelectedSections(prev => {
      const key = section.section + '||' + section.day + '||' + section.start_time;
      const exists = prev.find(s => s._key === key);
      if (exists) return prev.filter(s => s._key !== key);
      const newEntry = { ...section, _key: key };
      if (prev.length < 2) return [...prev, newEntry];
      // Replace the second (last) selection
      return [prev[0], newEntry];
    });
  };

  const isSectionSelected = (section) => {
    const key = section.section + '||' + section.day + '||' + section.start_time;
    return !!selectedSections.find(s => s._key === key);
  };

  const [a, b] = selectedSections;

  const fields = [
    { label: 'Section',       key: 'section' },
    { label: 'Instructor',    key: 'instructor' },
    { label: 'Day',           key: 'day' },
    { label: 'Time',          fn: s => `${s.start_time} – ${s.end_time}` },
    { label: 'Room',          key: 'room' },
    { label: 'Email',         key: 'email',        isEmail: true },
    { label: 'Office Hours',  key: 'office_hours' },
  ];

  const getValue = (field, section) => {
    if (field.fn) return field.fn(section);
    return section[field.key] || 'Not available';
  };

  return (
    <div className="feature-page container">
      <h1 className="feature-heading">Section Comparison</h1>
      <p className="feature-subheading">Compare two sections of the same course side by side.</p>

      {error && <div className="error-msg">{error}</div>}

      {/* Course dropdown */}
      <div className="compare-filter">
        <label className="input-label" htmlFor="course-select">Course</label>
        <select
          id="course-select"
          className="select-field compare-course-select"
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
          aria-label="Select a course to compare"
        >
          <option value="">-- Select a Course --</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Empty state — no course selected */}
      {!selectedCourse && (
        <div className="empty-state section-gap">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-heading">Select a course to compare its sections.</div>
        </div>
      )}

      {selectedCourse && loadingS && <div className="status-text">Loading sections…</div>}

      {/* Only one section available */}
      {selectedCourse && !loadingS && sections.length === 1 && (
        <div className="one-section-msg">
          Only one section is available for this course. No comparison possible.
        </div>
      )}

      {/* Section selector checkboxes */}
      {selectedCourse && !loadingS && sections.length > 1 && (
        <div className="section-selector">
          <p className="feature-subheading">Select two sections to compare:</p>
          <div className="section-check-list">
            {sections.map((s, i) => {
              const key = s.section + '||' + s.day + '||' + s.start_time;
              const isSelected = isSectionSelected(s);
              return (
                <label key={key} className={`section-check-item${isSelected ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    id={`sec-check-${i}`}
                    checked={isSelected}
                    onChange={() => toggleSection(s)}
                    aria-label={`Select section ${s.section} on ${s.day}`}
                  />
                  <span>
                    <strong>{s.section}</strong> — {s.day} {s.start_time}–{s.end_time} — {s.instructor} — {s.room}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {a && b && (
        <div className="section-gap">
          <div className="compare-table-wrapper">
            <table className="compare-table" aria-label="Section comparison table">
              <thead>
                <tr>
                  <th scope="col" className="compare-label-col">Field</th>
                  <th scope="col">{a.section}</th>
                  <th scope="col">{b.section}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(field => {
                  const valA = getValue(field, a);
                  const valB = getValue(field, b);
                  const differs = valA !== valB;
                  return (
                    <tr key={field.label} className={differs ? 'row-differs' : ''}>
                      <td className="compare-label">{field.label}</td>
                      <td>
                        {field.isEmail
                          ? <a href={`mailto:${valA}`}>{valA}</a>
                          : valA}
                      </td>
                      <td>
                        {field.isEmail
                          ? <a href={`mailto:${valB}`}>{valB}</a>
                          : valB}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionComparison;

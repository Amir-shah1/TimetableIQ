import React, { useState, useEffect, useRef, useMemo } from 'react';
import TimetableGrid from '../components/TimetableGrid';
import CourseTable from '../components/CourseTable';
import './TeacherTimetable.css';

function groupedCourseKey(c) {
  return `${c.section}||${c.course}`;
}

function TeacherTimetable() {
  const [teachers, setTeachers]     = useState([]);
  const [query, setQuery]           = useState('');
  const [filtered, setFiltered]     = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [timetable, setTimetable]   = useState([]);
  const [loadingT, setLoadingT]     = useState(false);
  const [error, setError]           = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch all teachers on mount
  useEffect(() => {
    fetch('/api/teachers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTeachers(data); })
      .catch(() => setError('Timetable data is currently unavailable. Please contact TechNest.'));
  }, []);

  // Filter as user types
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(teachers);
    } else {
      setFiltered(
        teachers.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
      );
    }
  }, [query, teachers]);

  const selectTeacher = (teacher) => {
    setSelected(teacher);
    setQuery(teacher.name);
    setShowDropdown(false);
    // Fetch timetable
    setLoadingT(true);
    fetch(`/api/teacher-timetable/${encodeURIComponent(teacher.name)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTimetable(data);
        else setTimetable([]);
        setLoadingT(false);
      })
      .catch(() => { setTimetable([]); setLoadingT(false); });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const groupedTimetable = useMemo(() => {
    const map = new Map();
    timetable.forEach(c => {
      const key = groupedCourseKey(c);
      if (!map.has(key)) {
        map.set(key, { ...c, _rawSlots: [c] });
      } else {
        map.get(key)._rawSlots.push(c);
      }
    });
    return Array.from(map.values());
  }, [timetable]);

  return (
    <div className="feature-page container">
      <h1 className="feature-heading">Teacher Timetable</h1>
      <p className="feature-subheading">Search for a teacher to view their full weekly schedule.</p>

      {error && <div className="error-msg">{error}</div>}

      {/* Searchable teacher dropdown */}
      <div className="teacher-search-wrapper">
        <label className="input-label" htmlFor="teacher-search">Teacher Name</label>
        <input
          id="teacher-search"
          ref={inputRef}
          type="text"
          className="input-field"
          placeholder="Type a teacher name…"
          value={query}
          aria-label="Search for a teacher"
          aria-autocomplete="list"
          aria-controls="teacher-dropdown"
          aria-expanded={showDropdown}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); setSelected(null); }}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
        />
        {showDropdown && filtered.length > 0 && (
          <ul
            id="teacher-dropdown"
            ref={dropdownRef}
            className="teacher-dropdown"
            role="listbox"
            aria-label="Teacher suggestions"
          >
            {filtered.map(t => (
              <li
                key={t.name}
                role="option"
                className="teacher-dropdown-item"
                aria-selected={selected?.name === t.name}
                onClick={() => selectTeacher(t)}
                onKeyDown={e => { if (e.key === 'Enter') selectTeacher(t); }}
                tabIndex={0}
              >
                {t.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Teacher info bar */}
      {selected && (
        <div className="teacher-info-bar">
          <div className="teacher-info-field">
            <span className="info-label">Name</span>
            <span className="info-value info-name">{selected.name}</span>
          </div>
          <div className="teacher-info-field">
            <span className="info-label">Email</span>
            <a href={`mailto:${selected.email}`} className="info-value" aria-label={`Email ${selected.name}`}>
              {selected.email}
            </a>
          </div>
          <div className="teacher-info-field">
            <span className="info-label">Office</span>
            <span className="info-value">{selected.office_room}</span>
          </div>
          <div className="teacher-info-field">
            <span className="info-label">Hours</span>
            <span className="info-value">{selected.office_hours}</span>
          </div>
        </div>
      )}

      {/* Timetable grid */}
      {!selected && (
        <div className="empty-state section-gap">
          <div className="empty-state-icon">👨‍🏫</div>
          <div className="empty-state-heading">Search for a teacher to view their timetable.</div>
        </div>
      )}

      {selected && loadingT && <div className="status-text">Loading timetable…</div>}

      {selected && !loadingT && timetable.length === 0 && (
        <div className="empty-state section-gap">
          <div className="empty-state-heading">No timetable found for {selected.name}.</div>
        </div>
      )}

      {selected && !loadingT && timetable.length > 0 && (
        <div className="section-gap">
          <h2 className="feature-subheading" style={{ marginBottom: '15px' }}>Classes</h2>
          <CourseTable 
            courses={groupedTimetable}
            selectedKeys={new Set(groupedTimetable.map(c => groupedCourseKey(c)))}
            onToggle={() => {}} // Read-only
            compact={true}
            getCourseKey={groupedCourseKey}
          />
          <div style={{ marginTop: '40px' }}>
            <h2 className="feature-subheading" style={{ marginBottom: '15px' }}>Weekly Schedule</h2>
            <TimetableGrid courses={timetable} highlightClashes={false} />
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherTimetable;

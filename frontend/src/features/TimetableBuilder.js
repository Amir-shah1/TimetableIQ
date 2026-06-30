import React, { useState, useEffect, useRef, useMemo } from 'react';
import CourseTable from '../components/CourseTable';
import TimetableGrid from '../components/TimetableGrid';
import './TimetableBuilder.css';

function groupedCourseKey(c) {
  return `${c.section}||${c.course}`;
}

const DEPTS = [
  { label: 'All', value: '' },
  { label: 'CS',  value: 'CS' },
  { label: 'SE',  value: 'SE' },
];

function TimetableBuilder() {
  const [dept, setDept]               = useState('');
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [builtCourses, setBuiltCourses]       = useState([]);
  const [clashes, setClashes]         = useState([]);
  const [built, setBuilt]             = useState(false);
  const gridRef = useRef(null);

  // Fetch courses
  useEffect(() => {
    setLoading(true);
    setError('');
    const url = dept ? `/api/courses?department=${dept}` : '/api/courses';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          setError('Timetable data is currently unavailable. Please contact TechNest.');
          setCourses([]);
        }
      })
      .catch(() => {
        setError('Timetable data is currently unavailable. Please contact TechNest.');
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [dept]);

  const groupedCourses = useMemo(() => {
    const map = new Map();
    courses.forEach(c => {
      const key = groupedCourseKey(c);
      if (!map.has(key)) {
        map.set(key, { ...c, _rawSlots: [c] });
      } else {
        map.get(key)._rawSlots.push(c);
      }
    });
    return Array.from(map.values());
  }, [courses]);

  const handleToggle = (key, courseGroup) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      let nextList;
      if (next.has(key)) {
        next.delete(key);
        nextList = selectedCourses.filter(c => groupedCourseKey(c) !== key);
      } else {
        next.add(key);
        nextList = [...selectedCourses, courseGroup];
      }
      setSelectedCourses(nextList);
      return next;
    });
  };

  const handleBuild = async () => {
    if (!selectedCourses.length) return;
    // Check for clashes first
    const payload = [];
    selectedCourses.forEach(group => {
      group._rawSlots.forEach(slot => {
        payload.push({
          section: slot.section, course: slot.course, day: slot.day,
          start_time: slot.start_time, end_time: slot.end_time,
        });
      });
    });
    try {
      const res = await fetch('/api/clash-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: payload }),
      });
      const data = await res.json();
      setClashes(data.clashes || []);
    } catch {
      setClashes([]);
    }
    const flatSlots = [];
    selectedCourses.forEach(g => flatSlots.push(...g._rawSlots));
    setBuiltCourses(flatSlots);
    setBuilt(true);
  };

  const handleExportPDF = async () => {
    if (!gridRef.current) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(gridRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save('TimetableIQ_My_Timetable.pdf');
  };

  const handleExportImage = async () => {
    if (!gridRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(gridRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = 'TimetableIQ_My_Timetable.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const hasClashes = clashes.length > 0;

  return (
    <div className="feature-page container">
      <h1 className="feature-heading">Timetable Builder</h1>
      <p className="feature-subheading">Select your courses and generate your personal weekly timetable.</p>

      {/* Department filter */}
      <div className="dept-tabs" role="tablist" aria-label="Department filter">
        {DEPTS.map(d => (
          <button key={d.value} role="tab"
            className={`dept-tab${dept === d.value ? ' active' : ''}`}
            aria-selected={dept === d.value}
            onClick={() => setDept(d.value)}>
            {d.label}
          </button>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Build button placed above the table for easy access */}
      {selectedCourses.length > 0 && (
        <div className="build-actions" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', position: 'sticky', top: '10px', zIndex: 10 }}>
          <button
            id="build-timetable-btn"
            className="btn btn-primary"
            onClick={handleBuild}
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            Build Timetable ({selectedCourses.length} selected)
          </button>
        </div>
      )}

      {loading ? (
        <div className="status-text">Loading courses…</div>
      ) : (
        <CourseTable
          courses={groupedCourses}
          selectedKeys={selectedKeys}
          onToggle={handleToggle}
          compact={true}
          getCourseKey={groupedCourseKey}
        />
      )}

      {/* Generated timetable */}
      {built && (
        <div className="section-gap">
          {/* Clash warning */}
          {hasClashes && (
            <div className="warning-banner">
              ⚠️ Warning: Your selection contains clashing courses. Conflicts are highlighted in red.
            </div>
          )}

          {/* Timetable grid */}
          {builtCourses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-heading">Select courses above to generate your timetable.</div>
            </div>
          ) : (
            <div ref={gridRef} className="timetable-export-area">
              <TimetableGrid courses={builtCourses} highlightClashes={hasClashes} />
            </div>
          )}

          {/* Export buttons */}
          {builtCourses.length > 0 && (
            <div className="export-row">
              <button id="export-pdf-btn" className="btn btn-secondary" onClick={handleExportPDF}>
                Export as PDF
              </button>
              <button id="export-img-btn" className="btn btn-secondary" onClick={handleExportImage}>
                Save as Image
              </button>
            </div>
          )}
        </div>
      )}

      {!built && (
        <div className="empty-state section-gap">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-heading">Select courses above to generate your timetable.</div>
        </div>
      )}
    </div>
  );
}

export default TimetableBuilder;

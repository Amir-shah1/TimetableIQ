import React, { useState, useEffect, useMemo } from 'react';
import './SectionComparison.css';

function SectionComparison() {
  const [allCourses, setAllCourses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [sectionA, setSectionA] = useState('');
  const [sectionB, setSectionB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load all sections and courses on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/sections').then(r => r.json()),
      fetch('/api/courses').then(r => r.json()),
    ])
      .then(([sectionsData, coursesData]) => {
        if (Array.isArray(sectionsData)) {
          // Sort sections alphabetically
          setAllSections(sectionsData.sort((a, b) => a.section.localeCompare(b.section)));
        } else {
          setError('Timetable data is currently unavailable.');
        }
        
        if (Array.isArray(coursesData)) {
          setAllCourses(coursesData);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Timetable data is currently unavailable. Please contact TechNest.');
        setLoading(false);
      });
  }, []);

  // Helper to extract unique courses and their teachers for a given section
  const getUniqueCourses = (sectionName) => {
    const taught = allCourses.filter(c => c.section === sectionName);
    const unique = [];
    const seen = new Set();
    for (const c of taught) {
      if (!seen.has(c.course)) {
        seen.add(c.course);
        unique.push(c);
      }
    }
    return unique;
  };

  const uniqueA = useMemo(() => sectionA ? getUniqueCourses(sectionA) : [], [sectionA, allCourses]);
  const uniqueB = useMemo(() => sectionB ? getUniqueCourses(sectionB) : [], [sectionB, allCourses]);

  // Find union of all course names from both sections for comparison
  const commonCourseNames = useMemo(() => {
    const names = new Set([...uniqueA.map(c => c.course), ...uniqueB.map(c => c.course)]);
    return Array.from(names).sort();
  }, [uniqueA, uniqueB]);

  return (
    <div className="feature-page container">
      <h1 className="feature-heading">Section Comparison</h1>
      <p className="feature-subheading">Compare course subjects and teachers across two different sections side by side.</p>

      {error && <div className="error-msg">{error}</div>}

      {/* Section selectors */}
      <div className="compare-filter" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label className="input-label" htmlFor="section-a-select">Section 1</label>
          <select
            id="section-a-select"
            className="select-field compare-course-select"
            value={sectionA}
            onChange={e => setSectionA(e.target.value)}
            aria-label="Select first section"
          >
            <option value="">-- Select Section 1 --</option>
            {allSections.map(s => (
              <option key={s.section} value={s.section} disabled={s.section === sectionB}>
                {s.section}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <label className="input-label" htmlFor="section-b-select">Section 2</label>
          <select
            id="section-b-select"
            className="select-field compare-course-select"
            value={sectionB}
            onChange={e => setSectionB(e.target.value)}
            aria-label="Select second section"
          >
            <option value="">-- Select Section 2 --</option>
            {allSections.map(s => (
              <option key={s.section} value={s.section} disabled={s.section === sectionA}>
                {s.section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="status-text">Loading data…</div>}

      {/* Empty state — waiting for both sections */}
      {!loading && (!sectionA || !sectionB) && (
        <div className="empty-state section-gap">
          <div className="empty-state-icon">⚖️</div>
          <div className="empty-state-heading">Select two different sections to compare.</div>
        </div>
      )}

      {/* Comparison table */}
      {sectionA && sectionB && (
        <div className="section-gap">
          <div className="compare-table-wrapper">
            <table className="compare-table" aria-label="Section comparison table">
              <thead>
                <tr>
                  <th scope="col" className="compare-label-col" style={{ width: '40%' }}>Subject</th>
                  <th scope="col">{sectionA} Instructor</th>
                  <th scope="col">{sectionB} Instructor</th>
                </tr>
              </thead>
              <tbody>
                {commonCourseNames.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No courses found for these sections.</td>
                  </tr>
                ) : (
                  commonCourseNames.map(courseName => {
                    const courseA = uniqueA.find(c => c.course === courseName);
                    const courseB = uniqueB.find(c => c.course === courseName);
                    
                    const instA = courseA ? courseA.instructor : <span style={{color: '#aaa'}}>Not Offered</span>;
                    const instB = courseB ? courseB.instructor : <span style={{color: '#aaa'}}>Not Offered</span>;

                    const differs = courseA?.instructor !== courseB?.instructor;

                    return (
                      <tr key={courseName} className={differs ? 'row-differs' : ''}>
                        <td className="compare-label"><strong>{courseName}</strong></td>
                        <td>{instA}</td>
                        <td>{instB}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionComparison;

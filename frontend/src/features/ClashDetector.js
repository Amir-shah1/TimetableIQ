import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import CourseTable from '../components/CourseTable';
import './ClashDetector.css';

const DEPTS = [
  { label: 'All', value: '' },
  { label: 'CS',  value: 'CS' },
  { label: 'SE',  value: 'SE' },
];

function groupedCourseKey(c) {
  return `${c.section}||${c.course}`;
}

function ClashDetector() {
  const [dept, setDept]               = useState('');
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [clashes, setClashes]         = useState(null);
  const [checking, setChecking]       = useState(false);
  
  // Notification states
  const [showSuccess, setShowSuccess] = useState(false);
  const [dismissedClash, setDismissedClash] = useState(false);
  const successTimerRef = useRef(null);

  const debounceRef = useRef(null);

  // Fetch courses when dept filter changes
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

  // Group courses by course and section so they only appear once
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

  // Debounced clash check
  const checkClashes = useCallback((selGroups) => {
    if (selGroups.length < 2) {
      setClashes(null);
      setChecking(false);
      setShowSuccess(false);
      return;
    }
    clearTimeout(debounceRef.current);
    setChecking(true);
    debounceRef.current = setTimeout(() => {
      // Flatten all slots from the selected groups
      const payload = [];
      selGroups.forEach(group => {
        group._rawSlots.forEach(slot => {
          payload.push({
            section:    slot.section,
            course:     slot.course,
            day:        slot.day,
            start_time: slot.start_time,
            end_time:   slot.end_time,
          });
        });
      });
      
      fetch('/api/clash-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: payload }),
      })
        .then(r => r.json())
        .then(data => {
          const newClashes = data.clashes || [];
          setClashes(newClashes);
          setChecking(false);
          setDismissedClash(false);
          
          if (newClashes.length === 0) {
            setShowSuccess(true);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => {
              setShowSuccess(false);
            }, 3000);
          } else {
            setShowSuccess(false);
          }
        })
        .catch(() => {
          setClashes([]);
          setChecking(false);
        });
    }, 200);
  }, []);

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
      checkClashes(nextList);
      return next;
    });
  };

  const selectedCount = selectedKeys.size;

  return (
    <div className="feature-page container">
      <h1 className="feature-heading">Clash Detector</h1>
      <p className="feature-subheading">Select courses to check for scheduling conflicts in real time.</p>

      {/* Department filter */}
      <div className="dept-tabs" role="tablist" aria-label="Department filter">
        {DEPTS.map(d => (
          <button
            key={d.value}
            role="tab"
            className={`dept-tab${dept === d.value ? ' active' : ''}`}
            aria-selected={dept === d.value}
            onClick={() => setDept(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && <div className="error-msg">{error}</div>}

      {/* Helper text (top) */}
      <div className="section-gap" aria-live="polite" aria-atomic="true" style={{ marginBottom: '20px' }}>
        {selectedCount === 0 && (
          <div className="empty-state" style={{ padding: '20px' }}>
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-heading">Select two or more courses to check for clashes.</div>
          </div>
        )}
        {selectedCount === 1 && (
          <div className="empty-state" style={{ padding: '20px' }}>
            <div className="empty-state-icon">➕</div>
            <div className="empty-state-heading">Select at least one more course to compare.</div>
          </div>
        )}
        {selectedCount >= 2 && checking && (
          <div className="status-text" style={{ padding: '20px', textAlign: 'center' }}>Calculating clashes...</div>
        )}
      </div>

      {/* Course table */}
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

      {/* Floating Notifications */}
      <div className="floating-notifications" aria-live="assertive">
        {selectedCount >= 2 && !checking && clashes !== null && clashes.length === 0 && showSuccess && (
          <div className="toast toast-success" role="alert">
            ✅ No clashes detected among your selected courses for the whole week.
          </div>
        )}
        
        {selectedCount >= 2 && !checking && clashes !== null && clashes.length > 0 && !dismissedClash && (
          <div className="toast toast-error" role="alert">
            <div className="toast-header">
              <strong>⚠️ Clash Detected</strong>
              <button 
                className="toast-close" 
                onClick={() => setDismissedClash(true)}
                aria-label="Close notification"
              >×</button>
            </div>
            <div className="toast-body">
              {clashes.map((cl, i) => (
                <div key={i} className="clash-item-toast">
                  <strong>{cl.course_a}</strong> ({cl.section_a}) clashes with <strong>{cl.course_b}</strong> ({cl.section_b}) on <strong>{cl.day}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClashDetector;

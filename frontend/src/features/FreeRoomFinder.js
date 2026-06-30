import React, { useState, useEffect } from 'react';
import './FreeRoomFinder.css';

function timeToMinutes(hhmm) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function FreeRoomFinder() {
  const [allCourses, setAllCourses] = useState([]);
  const [days, setDays]             = useState([]);
  const [day, setDay]               = useState('');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState('');
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [fetchError, setFetchError] = useState('');

  const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const SLOTS = [
    { label: 'Slot 1 (09:00 - 10:30)', start: '09:00', end: '10:30' },
    { label: 'Slot 2 (10:30 - 12:00)', start: '10:30', end: '12:00' },
    { label: 'Slot 3 (12:00 - 13:30)', start: '12:00', end: '13:30' },
    { label: 'Slot 4 (13:30 - 15:00)', start: '13:30', end: '15:00' },
    { label: 'Slot 5 (15:00 - 16:30)', start: '15:00', end: '16:30' },
    { label: 'Slot 6 (16:30 - 18:00)', start: '16:30', end: '18:00' },
    { label: 'Slot 7 (18:00 - 19:30)', start: '18:00', end: '19:30' },
  ];

  // Load all courses once
  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setFetchError('Timetable data is currently unavailable. Please contact TechNest.'); return; }
        setAllCourses(data);
        const uniqueDays = [...new Set(data.map(c => c.day))].sort(
          (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
        );
        setDays(uniqueDays);
      })
      .catch(() => setFetchError('Timetable data is currently unavailable. Please contact TechNest.'));
  }, []);

  // Validate and fetch rooms whenever inputs change
  useEffect(() => {
    if (!day || selectedSlotIndex === '') {
      setResults(null);
      return;
    }
    
    const slot = SLOTS[selectedSlotIndex];
    setLoading(true);
    fetch(`/api/free-rooms?day=${encodeURIComponent(day)}&startTime=${encodeURIComponent(slot.start)}&endTime=${encodeURIComponent(slot.end)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFetchError(data.error); setResults(null); }
        else setResults(data);
        setLoading(false);
      })
      .catch(() => { setFetchError('Error fetching room data.'); setLoading(false); });
  }, [day, selectedSlotIndex]);

  return (
    <div className="feature-page container">
      <h1 className="feature-heading">Free Room Finder</h1>
      <p className="feature-subheading">Find available rooms for a specific day and time range.</p>

      {fetchError && <div className="error-msg">{fetchError}</div>}

      {/* Filter row */}
      <div className="room-filter-row">
        <div className="filter-field">
          <label className="input-label" htmlFor="day-select">Day</label>
          <select
            id="day-select"
            className="select-field"
            value={day}
            onChange={e => setDay(e.target.value)}
            aria-label="Select day"
          >
            <option value="">-- Select Day --</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label className="input-label" htmlFor="slot-select">Time Slot</label>
          <select
            id="slot-select"
            className="select-field"
            value={selectedSlotIndex}
            onChange={e => setSelectedSlotIndex(e.target.value)}
            aria-label="Select time slot"
          >
            <option value="">-- Select Slot --</option>
            {SLOTS.map((s, idx) => <option key={idx} value={idx}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!day || selectedSlotIndex === '' ? (
        <div className="empty-state section-gap">
          <div className="empty-state-icon">🏫</div>
          <div className="empty-state-heading">Select a day and time slot to find free rooms.</div>
        </div>
      ) : null}

      {loading && <div className="status-text">Loading rooms…</div>}

      {/* Results */}
      {results && !loading && (
        <div className="room-results section-gap">
          <div className="room-col">
            <h2 className="room-col-heading free-heading">Free Rooms</h2>
            {results.free_rooms.length === 0 ? (
              <p className="room-empty-text">No free rooms found for this slot.</p>
            ) : (
              <div className="room-table-wrapper">
                <table className="room-table" aria-label="Free rooms">
                  <thead><tr><th scope="col">Room</th></tr></thead>
                  <tbody>
                    {results.free_rooms.map(r => (
                      <tr key={r} className="free-room-row">
                        <td>{r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FreeRoomFinder;

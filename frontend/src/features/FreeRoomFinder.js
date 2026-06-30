import React, { useState, useEffect } from 'react';
import './FreeRoomFinder.css';

function timeToMinutes(hhmm) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function FreeRoomFinder() {
  const [allCourses, setAllCourses] = useState([]);
  const [days, setDays]             = useState([]);
  const [times, setTimes]           = useState([]);
  const [day, setDay]               = useState('');
  const [startTime, setStartTime]   = useState('');
  const [endTime, setEndTime]        = useState('');
  const [timeError, setTimeError]   = useState('');
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [fetchError, setFetchError] = useState('');

  const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // Load all courses once
  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setFetchError('Timetable data is currently unavailable. Please contact TechNest.'); return; }
        setAllCourses(data);
        // Unique days, sorted by DAY_ORDER
        const uniqueDays = [...new Set(data.map(c => c.day))].sort(
          (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
        );
        setDays(uniqueDays);
        // Unique times — collect all start_time and end_time values
        const timeSet = new Set();
        data.forEach(c => { if (c.start_time) timeSet.add(c.start_time); if (c.end_time) timeSet.add(c.end_time); });
        const sortedTimes = [...timeSet].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
        setTimes(sortedTimes);
      })
      .catch(() => setFetchError('Timetable data is currently unavailable. Please contact TechNest.'));
  }, []);

  // Validate and fetch rooms whenever inputs change
  useEffect(() => {
    if (!day || !startTime || !endTime) {
      setResults(null);
      setTimeError('');
      return;
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      setTimeError('End time must be after start time.');
      setResults(null);
      return;
    }
    setTimeError('');
    setLoading(true);
    fetch(`/api/free-rooms?day=${encodeURIComponent(day)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFetchError(data.error); setResults(null); }
        else setResults(data);
        setLoading(false);
      })
      .catch(() => { setFetchError('Error fetching room data.'); setLoading(false); });
  }, [day, startTime, endTime]);

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
          <label className="input-label" htmlFor="start-time-select">Start Time</label>
          <select
            id="start-time-select"
            className={`select-field${timeError ? ' error' : ''}`}
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            aria-label="Select start time"
            aria-describedby={timeError ? 'time-error' : undefined}
          >
            <option value="">-- Start Time --</option>
            {times.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label className="input-label" htmlFor="end-time-select">End Time</label>
          <select
            id="end-time-select"
            className={`select-field${timeError ? ' error' : ''}`}
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            aria-label="Select end time"
            aria-describedby={timeError ? 'time-error' : undefined}
          >
            <option value="">-- End Time --</option>
            {times.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {timeError && <div id="time-error" className="inline-error" role="alert">{timeError}</div>}
        </div>
      </div>

      {/* Empty state */}
      {!day || !startTime || !endTime ? (
        <div className="empty-state section-gap">
          <div className="empty-state-icon">🏫</div>
          <div className="empty-state-heading">Select a day and time range to find free rooms.</div>
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
            )}
          </div>
          <div className="room-col">
            <h2 className="room-col-heading occupied-heading">Occupied Rooms</h2>
            {results.occupied_rooms.length === 0 ? (
              <p className="room-empty-text free-all-text">All rooms are free during this slot.</p>
            ) : (
              <table className="room-table occupied-table" aria-label="Occupied rooms">
                <thead>
                  <tr>
                    <th scope="col">Room</th>
                    <th scope="col">Course</th>
                    <th scope="col">Section</th>
                    <th scope="col">Instructor</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {results.occupied_rooms.map((r, i) => (
                    <tr key={i} className="occupied-room-row">
                      <td>{r.room}</td>
                      <td>{r.course}</td>
                      <td>{r.section}</td>
                      <td>{r.instructor}</td>
                      <td>{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FreeRoomFinder;

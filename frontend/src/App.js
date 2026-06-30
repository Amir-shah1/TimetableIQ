import React, { useState } from 'react';
import './App.css';
import NavBar from './components/NavBar';
import ClashDetector from './features/ClashDetector';
import TimetableBuilder from './features/TimetableBuilder';
import TeacherTimetable from './features/TeacherTimetable';
import FreeRoomFinder from './features/FreeRoomFinder';
import SectionComparison from './features/SectionComparison';
import TeacherDirectory from './features/TeacherDirectory';

// Feature list — order matches nav
const FEATURES = [
  { id: 'clash',      label: 'Clash Detector',      component: ClashDetector },
  { id: 'timetable', label: 'Timetable Builder',    component: TimetableBuilder },
  { id: 'teacher',   label: 'Teacher Timetable',    component: TeacherTimetable },
  { id: 'rooms',     label: 'Free Room Finder',     component: FreeRoomFinder },
  { id: 'compare',   label: 'Section Comparison',   component: SectionComparison },
  { id: 'directory', label: 'Teacher Directory',    component: TeacherDirectory },
];

function App() {
  const [activeId, setActiveId] = useState('clash');

  const active = FEATURES.find(f => f.id === activeId) || FEATURES[0];
  const ActiveComponent = active.component;

  return (
    <div className="app-wrapper">
      <NavBar
        features={FEATURES}
        activeId={activeId}
        onNavigate={setActiveId}
      />
      <main className="app-content">
        <div className="feature-transition" key={activeId}>
          <ActiveComponent />
        </div>
      </main>
      <footer className="app-footer">
        TimetableIQ — CUIATD Smart Timetable Tools &nbsp;|&nbsp; TechNest, CUIATD
      </footer>
    </div>
  );
}

export default App;

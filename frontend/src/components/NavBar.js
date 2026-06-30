import React, { useState } from 'react';
import './NavBar.css';

function NavBar({ features, activeId, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (id) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-inner container">
        {/* Logo */}
        <span className="navbar-logo" aria-label="TimetableIQ home">
          TimetableIQ
        </span>

        {/* Desktop nav items */}
        <ul className="navbar-links" role="menubar">
          {features.map(f => (
            <li key={f.id} role="none">
              <button
                role="menuitem"
                className={`navbar-link${activeId === f.id ? ' active' : ''}`}
                onClick={() => handleNav(f.id)}
                aria-current={activeId === f.id ? 'page' : undefined}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          <span className={`hamburger-icon${menuOpen ? ' open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
      >
        {features.map(f => (
          <button
            key={f.id}
            className={`mobile-menu-item${activeId === f.id ? ' active' : ''}`}
            onClick={() => handleNav(f.id)}
            tabIndex={menuOpen ? 0 : -1}
          >
            {f.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default NavBar;

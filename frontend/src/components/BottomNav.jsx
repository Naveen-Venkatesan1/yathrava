// src/components/BottomNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Train, Bell, User } from 'lucide-react';

export default function BottomNav() {
  const navStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    paddingBottom: 'env(safe-area-inset-bottom)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1000,
  };

  const linkStyle = {
    color: '#003366',
    textDecoration: 'none',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  };

  const activeStyle = {
    color: '#0284c7',
  };

  return (
    <nav style={navStyle}>
      <NavLink to="/" style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)} end>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/routes" style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}>
        <Train size={20} />
        <span>Routes</span>
      </NavLink>
      <NavLink to="/station-alert" style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}>
        <Bell size={20} />
        <span>Alerts</span>
      </NavLink>
      <NavLink to="/profile" style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}>
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="app-logo">Enterprise Product Catalogue</div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <span className="tmf-badge">TMF620 / TMF638</span>
        <div className="user-avatar" title="Admin User">👤</div>
      </div>
    </header>
  );
};

export default Header;
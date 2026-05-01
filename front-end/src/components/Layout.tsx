import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-container" style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gridTemplateRows: 'auto 1fr',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      fontFamily: "'IBM Plex Sans', sans-serif"
    }}>
      {/* 1. Global Header - Spans across the top */}
      <Header />

      {/* 2. Navigation Sidebar - Fixed height with internal scroll */}
      <Sidebar />

      {/* 3. Main Content Area - Where your Pages will render */}
      <main className="main-content" style={{
        padding: '2.5rem',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 68px)', // Header height offset
        backgroundColor: 'var(--bg-primary)'
      }}>
        {/* Container for page content to ensure max-width on ultra-wide screens */}
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
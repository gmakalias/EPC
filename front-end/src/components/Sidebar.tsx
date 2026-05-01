import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const sections = [
    { title: 'Design Studio', items: [
      { path: '/explorer', label: 'Catalogue Explorer', icon: '📚' },
      { path: '/spec', label: 'Product Spec Editor', icon: '📝' },
    ]},
    { title: 'Integration', items: [
      { path: '/architecture', label: '4-Layer Architecture', icon: '🎨' },
    ]}
  ];

  return (
    <aside className="sidebar">
      {sections.map((section, idx) => (
        <div key={idx} className="nav-section">
          <div className="nav-section-title">{section.title}</div>
          {section.items.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
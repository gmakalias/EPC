import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Form/Button';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <header className="page-header">
        <h1 className="page-title">EPC Overview</h1>
        <p className="page-description">Real-time status of the Enterprise Product Catalogue.</p>
      </header>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Active Offerings</div>
          <div className="stat-value">124</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value">8</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sync Status</div>
          <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>Healthy</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue Impact</div>
          <div className="stat-value">$2.4M</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <Card title="Recent Activity">
          <ul className="activity-log">
            {/* Logic from back-end/audit service */}
            <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
              <Badge label="Update" variant="active" /> <strong>Admin</strong> modified "Gigabit Fiber" Product Spec.
            </li>
          </ul>
        </Card>
        
        <Card title="Quick Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Create New Offering</button>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Export Catalog</button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
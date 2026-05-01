import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';

const LifecycleDashboard: React.FC = () => {
  const workflowSteps = ['Concept', 'Design', 'Validation', 'Launch', 'Retired'];

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Lifecycle Dashboard</h1>
        <p className="page-description">Governance and approval workflows for product iterations[cite: 1].</p>
      </header>

      <div className="workflow-stepper" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
        {workflowSteps.map((step, idx) => (
          <div key={step} style={{ textAlign: 'center', zIndex: 2 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: idx === 1 ? 'var(--accent-primary)' : 'var(--bg-secondary)', border: '2px solid var(--border-primary)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {idx + 1}
            </div>
            <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>{step}</span>
          </div>
        ))}
        <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, height: '2px', background: 'var(--border-primary)', zIndex: 1 }}></div>
      </div>

      <Card title="Pending Approvals">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Requested By</th>
              <th>Target State</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ultra 5G Bundle</td>
              <td>Design_Team_A</td>
              <td><Badge label="Active" variant="active" /></td>
              <td>
                <Button variant="primary" style={{ marginRight: '0.5rem' }}>Approve</Button>
                <Button variant="secondary">Reject</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default LifecycleDashboard;
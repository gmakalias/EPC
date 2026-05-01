import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { FormInput } from '../components/Form/FormInput';

const AuditLogViewer: React.FC = () => {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Audit Log Viewer</h1>
        <p className="page-description">Traceability and compliance logs for all catalogue modifications.</p>
      </header>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <FormInput label="" placeholder="Filter by User or Action..." style={{ flex: 1 }} />
          <select className="form-input" style={{ width: '200px' }}>
            <option>All Actions</option>
            <option>CREATE</option>
            <option>UPDATE</option>
            <option>DELETE</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-05-01 08:30</td>
              <td>admin_user</td>
              <td><Badge label="Update" variant="active" /></td>
              <td>ProductSpec: Fiber_1G</td>
              <td style={{ fontSize: '0.85rem' }}>Changed 'Bandwidth' constraint from 500 to 1000.</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AuditLogViewer;
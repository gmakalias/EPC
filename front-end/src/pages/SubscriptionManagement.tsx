import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { FormInput } from '../components/Form/FormInput';

const SubscriptionManagement: React.FC = () => {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Subscription Management</h1>
        <p className="page-description">Monitor and manage active customer subscriptions (TMF638)[cite: 1].</p>
      </header>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <FormInput label="" placeholder="Search by Subscription ID or Customer..." style={{ flex: 1 }} />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Sub ID</th>
              <th>Customer</th>
              <th>Product Offering</th>
              <th>Status</th>
              <th>Next Billing</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SUB-9921</td>
              <td>Acme Corp</td>
              <td>Enterprise Dedicated Fiber</td>
              <td><Badge label="Active" variant="active" /></td>
              <td>2026-06-01</td>
              <td><button className="btn btn-secondary btn-sm">Manage</button></td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
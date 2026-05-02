import React from 'react';
import Card from '../components/Card';
import { FormInput } from '../components/Form/FormInput';
import Badge from '../components/Badge';
import Button from '../components/Form/Button';

const PricingConfigurator: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pricing Configurator</h1>
        <p className="page-description">Manage price alterations, taxes, and recurring cycles[cite: 1].</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Card title="Price Points">
          <div className="price-item" style={{ padding: '1rem', border: '1px solid var(--border-primary)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Monthly Rental</strong>
              <Badge label="Recurring" variant="active" />
            </div>
            <FormInput label="Amount ($)" type="number" defaultValue="49.99" />
          </div>
          <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>+ Add Price Point</button>
        </Card>

        <Card title="Tax & Alterations">
          <div className="form-group">
            <label className="form-label">VAT / Tax Category</label>
            <select className="form-input">
              <option>Standard 20%</option>
              <option>Exempt</option>
            </select>
          </div>
          <FormInput label="Discount %" type="number" placeholder="0" />
        </Card>
      </div>
    </div>
  );
};

export default PricingConfigurator;
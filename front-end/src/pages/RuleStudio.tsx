import React from 'react';
import Card from '../components/Card';
import Button from '../components/Form/Button';
import { FormInput } from '../components/Form/FormInput';

const RuleStudio: React.FC = () => {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Rule Studio</h1>
        <p className="page-description">Configure eligibility, compatibility, and validation logic[cite: 1].</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Card title="Eligibility Rules">
          <div className="rule-builder-box" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.9rem' }}><strong>IF</strong> Customer.Region == "North"[cite: 1]</p>
            <p style={{ fontSize: '0.9rem' }}><strong>THEN</strong> Action.Allow(5G_Special_Offer)</p>
          </div>
          <Button variant="secondary" style={{ marginTop: '1rem', width: '100%' }}>+ Create New Logic Block</Button>
        </Card>

        <Card title="Product Compatibility">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Define "Requires" or "Excludes" relationships between offerings[cite: 1].
          </p>
          <div className="form-group">
            <label className="form-label">A excludes B</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="form-input"><option>Gigabit Fiber</option></select>
              <span style={{ alignSelf: 'center' }}>⛔</span>
              <select className="form-input"><option>Legacy DSL</option></select>
            </div>
          </div>
          <Button style={{ width: '100%' }}>Save Constraint</Button>
        </Card>
      </div>
    </div>
  );
};

export default RuleStudio;
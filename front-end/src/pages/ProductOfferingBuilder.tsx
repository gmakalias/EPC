import React from 'react';
import Card from '../components/Card';
import { FormInput } from '../components/Form/FormInput';
import Button from '../components/Button';

const ProductOfferingBuilder: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Product Offering Builder</h1>
        <p className="page-description">Map technical specifications to marketable products[cite: 1].</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <Card title="Core Configuration">
          <FormInput label="Offering Name" placeholder="e.g., Summer Special Fiber 1G" />
          <div className="form-group">
            <label className="form-label">Base Product Specification</label>
            <select className="form-input">
              <option>Select a Spec...</option>
              {/* Linked to product-specification.service[cite: 1] */}
            </select>
          </div>
        </Card>

        <Card title="Offering Stats">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <p><strong>Compliance:</strong> TMF620[cite: 1]</p>
            <p><strong>Visibility:</strong> B2C Channel</p>
          </div>
          <Button style={{ width: '100%', marginTop: '1rem' }}>Save Offering</Button>
        </Card>
      </div>
    </div>
  );
};

export default ProductOfferingBuilder;
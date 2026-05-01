import React, { useState } from 'react';
import Card from '../components/Card';
import { FormInput } from '../components/Form/FormInput';
import Button from '../components/Button';

const ProductSpecEditor: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Product Spec Editor</h1>
        <p className="page-description">Define characteristics with types, constraints, and validation[cite: 1].</p>
      </div>

      <Card title="Spec Configuration">
        <div className="char-list">
          {/* Implement dynamic characteristic rows from prototype[cite: 1] */}
          <div className="char-item">
            <div><strong>Bandwidth</strong></div>
            <FormInput label="" placeholder="Value (e.g. 1000)" />
            <Button variant="secondary" icon="🗑️" />
          </div>
        </div>
        <Button style={{ marginTop: '1rem' }}>➕ Add Characteristic</Button>
      </Card>
    </div>
  );
};

export default ProductSpecEditor;
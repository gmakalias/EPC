import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const BundleDesigner: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bundle Designer</h1>
        <p className="page-description">Combine multiple offerings into a single commercial package[cite: 1].</p>
      </div>

      <Card title="Bundle Composition">
        <div className="drop-zone" style={{ border: '2px dashed var(--border-primary)', padding: '3rem', textAlign: 'center', borderRadius: '8px' }}>
          Drag and drop offerings here to create a bundle[cite: 1].
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <h4>Included Offerings</h4>
          <table className="data-table">
            <thead>
              <tr><th>Offering Name</th><th>Qty</th><th>Action</th></tr>
            </thead>
            <tbody>
              {/* Dynamically populated list of bundled items[cite: 1] */}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BundleDesigner;
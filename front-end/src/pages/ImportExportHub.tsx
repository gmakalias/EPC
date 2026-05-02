import React from 'react';
import Card from '../components/Card';
import Button from '../components/Form/Button';

const ImportExportHub: React.FC = () => {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Import / Export Hub</h1>
        <p className="page-description">Bulk manage catalogue data via CSV, JSON, or TMF-compliant API[cite: 1].</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Card title="Bulk Import">
          <div style={{ border: '2px dashed var(--border-primary)', padding: '3rem', textAlign: 'center', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <p>Drag files here or click to upload</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Supported: .csv, .json (TMF620 Schema)[cite: 1]</span>
          </div>
          <Button style={{ width: '100%' }}>Process Import</Button>
        </Card>

        <Card title="Export Options">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-primary)', borderRadius: '6px' }}>
              <span>Full Product Catalogue (JSON)</span>
              <Button variant="secondary" btn-sm>Download</Button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-primary)', borderRadius: '6px' }}>
              <span>Active Pricing Tables (CSV)</span>
              <Button variant="secondary" btn-sm>Download</Button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-primary)', borderRadius: '6px' }}>
              <span>TMF-638 Service Inventory</span>
              <Button variant="secondary" btn-sm>Download</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImportExportHub;
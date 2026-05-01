import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const RFSConfiguration: React.FC = () => {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">RFS Configuration</h1>
        <p className="page-description">Define technical service parameters and resource requirements[cite: 1].</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Card title="Technical Specs (RFS)">
          <div className="rfs-item" style={{ padding: '1rem', border: '1px solid var(--border-primary)', borderRadius: '8px', marginBottom: '1rem' }}>
            <strong>FiberPort_VLAN_Config</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resource: Juniper PE Router[cite: 1]</p>
          </div>
          <Button variant="secondary">+ Add RFS Specification</Button>
        </Card>

        <Card title="Resource Mapping">
          <p style={{ fontSize: '0.9rem' }}>Mapping technical services to physical/logical infrastructure[cite: 1].</p>
          <div className="mapping-visual" style={{ height: '200px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            [ Visual Mapping Diagram ]
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RFSConfiguration;
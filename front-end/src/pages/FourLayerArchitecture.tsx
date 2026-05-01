import React from 'react';

const FourLayerArchitecture: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">4-Layer Architecture</h1>
        <p className="page-description">Commercial → CFS → RFS → Resources decomposition[cite: 1].</p>
      </div>

      <div className="layer-card layer-commercial">
        <div className="layer-title">Layer 1: Commercial (TMF620)</div>
        <div className="layer-subtitle">Customer-facing marketing view[cite: 1].</div>
      </div>

      <div className="layer-card layer-cfs">
        <div className="layer-title">Layer 2: CFS (TMF638)</div>
        <div className="layer-subtitle">Customer-facing services[cite: 1].</div>
      </div>

      <div className="layer-card layer-rfs">
        <div className="layer-title">Layer 3: RFS (TMF638)</div>
        <div className="layer-subtitle">Resource-facing services (Technical)[cite: 1].</div>
      </div>

      <div className="layer-card layer-resource">
        <div className="layer-title">Layer 4: Physical/Logical Resources</div>
        <div className="layer-subtitle">MSISDN, SIM, IP Addresses[cite: 1].</div>
      </div>
    </div>
  );
};

export default FourLayerArchitecture;
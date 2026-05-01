import React from 'react';

const Loading: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
    <div className="tmf-badge" style={{ animation: 'pulse 1.5s infinite' }}>
      Loading EPC Data...
    </div>
  </div>
);

export default Loading;
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const CatalogueExplorer: React.FC = () => {
  const [products, setProducts] = useState([]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Catalogue Explorer</h1>
        <p className="page-description">Browse and search products with TMF620 compliance.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">--</div>
        </div>
        {/* Add more stat-cards as per prototype */}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input className="search-input" placeholder="Search products..." style={{ flex: 1 }} />
          <Button variant="secondary">Filter</Button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Map products from API here */}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default CatalogueExplorer;
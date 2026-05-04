import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Form/Button';
import ChatBot from '../components/OfferChatbot';

// 1. Define the allowed Badge variants exactly as per your component definition
type BadgeVariant = "active" | "draft" | "retired" | "cfs" | "rfs" | "resource";

interface Product {
  id: string | number;
  name: string;
  type: string;
  category: string;
  status: string; 
  version: string;
  price: string | number;
}

const CatalogueExplorer: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/product-offering') 
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching catalogue:", err);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter(p => {
    const name = p.name || '';
    const status = p.status || '';
    const type = p.type || '';
    
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || status === filter || type === filter;
    return matchSearch && matchFilter;
  });

  // Helper to safely cast status string to the allowed BadgeVariant type
  const getBadgeVariant = (status: string): BadgeVariant => {
    const s = status.toLowerCase();
    const validVariants: BadgeVariant[] = ["active", "draft", "retired", "cfs", "rfs", "resource"];
    return validVariants.includes(s as BadgeVariant) ? (s as BadgeVariant) : "draft";
  };

  if (loading) return <div className="p-4">Loading TMF620 Catalogue...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Catalogue Explorer</h1>
        <p className="page-description">
          Browse and search {products.length} products with TMF620 compliance.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">{products.filter(p => p.status === 'active').length}</div>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <input 
            className="search-input" 
            placeholder="Search products..." 
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button 
            variant={filter === 'all' ? 'primary' : 'secondary'} 
            onClick={() => setFilter('all')}
          >All</Button>
          <Button 
            variant={filter === 'active' ? 'primary' : 'secondary'} 
            onClick={() => setFilter('active')}
          >Active</Button>
          <Button variant="primary">+ Add Product</Button>
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
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><code>{p.id}</code></td>
                <td><strong>{p.name}</strong></td>
                <td>{p.type}</td>
                <td>
                   {/* 
                     FIXED: Added mandatory 'label' prop 
                     and kept the 'variant' prop with type-casting.
                   */}
                   <Badge 
                     variant={getBadgeVariant(p.status)} 
                     label={p.status} 
                   />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary">👁️</Button>
                    <Button 
                      variant="danger" 
                      onClick={() => setProducts(products.filter(item => item.id !== p.id))}
                    >🗑️</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default CatalogueExplorer;
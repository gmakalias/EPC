import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { FormInput } from '../components/Form/FormInput';

const CategoryManager: React.FC = () => {
  return (
    <div className="category-manager">
      <header className="page-header">
        <h1 className="page-title">Category Manager</h1>
        <p className="page-description">Organize products into hierarchical TMF620 categories.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        <Card title="Category Tree">
          <div className="tree-container" style={{ minHeight: '400px' }}>
            {/* Implement recursive tree rendering for parent/child categories */}
            <div className="tree-node active">🌐 Root Catalogue</div>
            <div className="tree-node" style={{ marginLeft: '1.5rem' }}>📱 Mobile Services</div>
            <div className="tree-node" style={{ marginLeft: '1.5rem' }}>🌐 Broadband</div>
          </div>
          <Button variant="secondary" style={{ width: '100%' }}>Add New Category</Button>
        </Card>

        <Card title="Category Details">
          <FormInput label="Category Name" defaultValue="Mobile Services" />
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={4} defaultValue="Standard mobile voice and data plans." />
          </div>
          <div className="form-group">
            <label className="form-label">Lifecycle Status</label>
            <select className="form-input">
              <option>Active</option>
              <option>Draft</option>
              <option>Retired</option>
            </select>
          </div>
          <Button>Update Category</Button>
        </Card>
      </div>
    </div>
  );
};

export default CategoryManager;
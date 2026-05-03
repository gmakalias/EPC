import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// 1. Import your existing pages
import Dashboard from './pages/Dashboard';
import CatalogueExplorer from './pages/CatalogueExplorer';
import ProductSpecEditor from './pages/ProductSpecEditor';
import ProductOfferingBuilder from './pages/ProductOfferingBuilder';
import PricingConfigurator from './pages/PricingConfigurator';
import CategoryManager from './pages/CategoryManager';
import RuleStudio from './pages/RuleStudio';
import SubscriptionManagement from './pages/SubscriptionManagement';
import AuditLogViewer from './pages/AuditLogViewer';

const App = () => {
  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* 2. Sidebar Navigation */}
      <nav style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px' }}>
        <h2>EPC System</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/" style={navLinkStyle}>Dashboard</Link></li>
          <li><Link to="/catalogue" style={navLinkStyle}>Catalogue Explorer</Link></li>
          <li><Link to="/specs" style={navLinkStyle}>Product Specs</Link></li>
          <li><Link to="/offerings" style={navLinkStyle}>Offerings</Link></li>
          <li><Link to="/pricing" style={navLinkStyle}>Pricing</Link></li>
          <li><Link to="/categories" style={navLinkStyle}>Categories</Link></li>
          <li><Link to="/rules" style={navLinkStyle}>Rule Studio</Link></li>
          <li><Link to="/subscriptions" style={navLinkStyle}>Subscriptions</Link></li>
          <li><Link to="/audit" style={navLinkStyle}>Audit Logs</Link></li>
        </ul>
      </nav>

      {/* 3. Main Content Area */}
      <main style={{ flexGrow: 1, padding: '20px', backgroundColor: '#f4f7f6' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/catalogue" element={<CatalogueExplorer />} />
          <Route path="/specs" element={<ProductSpecEditor />} />
          <Route path="/offerings" element={<ProductOfferingBuilder />} />
          <Route path="/pricing" element={<PricingConfigurator />} />
          <Route path="/categories" element={<CategoryManager />} />
          <Route path="/rules" element={<RuleStudio />} />
          <Route path="/subscriptions" element={<SubscriptionManagement />} />
          <Route path="/audit" element={<AuditLogViewer />} />
        </Routes>
      </main>
    </div>
  );
};

// Simple helper style
const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  display: 'block',
  padding: '10px 0',
  borderBottom: '1px solid #34495e'
};

export default App;
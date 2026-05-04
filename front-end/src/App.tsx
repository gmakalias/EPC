import React from 'react';	
import ReactDOM from 'react-dom/client'
import { Routes, Route, Link } from 'react-router-dom';
import './index.css' //

// 1. Import your existing pages
import Dashboard from './pages/Dashboard';
import CatalogueExplorer from './pages/CatalogueExplorer';
import ProductSpecEditor from './pages/ProductSpecEditor';
import ProductOfferingBuilder from './pages/ProductOfferingBuilder';
import BundleDesigner from './pages/BundleDesigner';
import RuleStudio from './pages/RuleStudio';
import CategoryManager from './pages/CategoryManager';
import PricingConfigurator from './pages/PricingConfigurator';
import SubscriptionManagement from './pages/SubscriptionManagement';
import RFSConfiguration from './pages/RFSConfiguration';
import LifecycleDashboard from './pages/LifecycleDashboard';
import AuditLogViewer from './pages/AuditLogViewer';
import ImportExportHub from './pages/ImportExportHub';
import FourLayerArchitecture from './pages/FourLayerArchitecture';

const App = () => {
  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* 2. Sidebar Navigation */}
      <nav style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px' }}>
        <h2>EPC System</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/" style={navLinkStyle}>Dashboard</Link></li>
          <li><Link to="/catalogue" style={navLinkStyle}>Catalogue Explorer</Link></li>
          <li><Link to="/specs" style={navLinkStyle}>Product Spec Editor</Link></li>
          <li><Link to="/offerings" style={navLinkStyle}>Product Offering Builder</Link></li>
		  <li><Link to="/bundles" style={navLinkStyle}>Bundle Designer</Link></li>
          <li><Link to="/rules" style={navLinkStyle}>Rule Studio</Link></li> 
          <li><Link to="/pricing" style={navLinkStyle}>Pricing</Link></li>
		  <li><Link to="/categories" style={navLinkStyle}>Categories</Link></li>
          <li><Link to="/subscriptions" style={navLinkStyle}>Subscriptions</Link></li>
		  <li><Link to="/rfsrs" style={navLinkStyle}>RFS/RS Configuration</Link></li>
		  <li><Link to="/structure" style={navLinkStyle}>Structure Designer</Link></li>
		  <li><Link to="/lifecycle" style={navLinkStyle}>Lifecycle Dashboard</Link></li>
		  <li><Link to="/audit" style={navLinkStyle}>Audit Logs</Link></li>
		  <li><Link to="/importexport" style={navLinkStyle}>Import / Export</Link></li>
		  <li><Link to="/architecture" style={navLinkStyle}>4 Layer Architecture</Link></li>
        </ul>
      </nav>

      {/* 3. Main Content Area */}
      <main style={{ flexGrow: 1, padding: '20px', backgroundColor: '#f4f7f6' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/catalogue" element={<CatalogueExplorer />} />
          <Route path="/specs" element={<ProductSpecEditor />} />
          <Route path="/offerings" element={<ProductOfferingBuilder />} />
          <Route path="/bundles" element={<BundleDesigner />} />
          <Route path="/rules" element={<RuleStudio />} />		  
          <Route path="/pricing" element={<PricingConfigurator />} />
          <Route path="/categories" element={<CategoryManager />} />
          <Route path="/subscriptions" element={<SubscriptionManagement />} />
          <Route path="/rfsrs" element={<RFSConfiguration />} />
          <Route path="/lifecycle" element={<LifecycleDashboard />} />
          <Route path="/audit" element={<AuditLogViewer />} />
          <Route path="/importexport" element={<ImportExportHub />} />
          <Route path="/architecture" element={<FourLayerArchitecture />} />
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
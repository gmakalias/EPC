import React from 'react';
import { Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <div className="app-container">
      <h1>EPC Project is Running</h1>
      <Routes>
        <Route path="/" element={<div>Welcome to the Dashboard</div>} />
        {/* Add more routes here later */}
      </Routes>
    </div>
  );
};

export default App;
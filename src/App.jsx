import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Transfer from './pages/Transfer';
import TransferStatus from './pages/TransferStatus';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<Transfer />} />
          <Route path="/status" element={<TransferStatus />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

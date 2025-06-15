
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            🏥 ICU AI System
          </Link>
          <div className="flex space-x-6">
            <Link 
              to="/" 
              className={`hover:text-blue-200 transition-colors ${
                location.pathname === '/' ? 'text-blue-200 font-semibold' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/patient-form" 
              className={`hover:text-blue-200 transition-colors ${
                location.pathname === '/patient-form' ? 'text-blue-200 font-semibold' : ''
              }`}
            >
              Add Patient
            </Link>
            <Link 
              to="/analytics" 
              className={`hover:text-blue-200 transition-colors ${
                location.pathname === '/analytics' ? 'text-blue-200 font-semibold' : ''
              }`}
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

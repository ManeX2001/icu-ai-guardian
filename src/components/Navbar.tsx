
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Stethoscope, LogOut, User } from 'lucide-react';

interface NavbarProps {
  userRole: string;
  onLogout: () => void;
}

const Navbar = ({ userRole, onLogout }: NavbarProps) => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-600">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold flex items-center gap-3 text-gray-800">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            ICU Dashboard
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md transition-colors ${
                location.pathname === '/' 
                  ? 'bg-blue-100 text-blue-700 font-semibold' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/patient-form" 
              className={`px-3 py-2 rounded-md transition-colors ${
                location.pathname === '/patient-form' 
                  ? 'bg-blue-100 text-blue-700 font-semibold' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              Patient Assessment
            </Link>
            <Link 
              to="/analytics" 
              className={`px-3 py-2 rounded-md transition-colors ${
                location.pathname === '/analytics' 
                  ? 'bg-blue-100 text-blue-700 font-semibold' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              AI Analytics
            </Link>
            
            <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-300">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {userRole}
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-red-600 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

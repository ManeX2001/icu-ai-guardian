
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import PatientFormPage from "./pages/PatientFormPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";
import LoginForm from "./components/LoginForm";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const savedAuth = localStorage.getItem('icu_auth');
    const savedRole = localStorage.getItem('icu_role');
    if (savedAuth === 'true' && savedRole) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
    }
  }, []);

  const handleLogin = (role: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('icu_auth', 'true');
    localStorage.setItem('icu_role', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    localStorage.removeItem('icu_auth');
    localStorage.removeItem('icu_role');
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoginForm onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar userRole={userRole} onLogout={handleLogout} />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/patient-form" element={<PatientFormPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

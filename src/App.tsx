import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminConsole from './components/AdminConsole';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('user_email');
    
    if (token && email) {
      try {
        const decoded = JSON.parse(atob(token));
        if (decoded.exp > Date.now()) {
          setIsAuthenticated(true);
          setUserEmail(email);
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_email');
        }
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
      }
    }
  }, []);

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
    setUserEmail('');
  };

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AdminConsole userEmail={userEmail} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;

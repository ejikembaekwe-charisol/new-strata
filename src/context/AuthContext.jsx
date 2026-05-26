import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is saved in localStorage
    const savedUser = localStorage.getItem('strata_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userToSave = userData || { name: 'Abdul-Qayyum', email: 'user@example.com', initials: 'AQ' };
    setUser(userToSave);
    localStorage.setItem('strata_user', JSON.stringify(userToSave));
  };

  const signup = (userData) => {
    login(userData); // For now, signup just logs you in
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('strata_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext } from 'react';

export const AuthContext = createContext({
  user: null,
  session: null,
  setUser: () => {},
  setSession: () => {},
});

export const AuthProvider = ({ value, children }) => {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

/* eslint-disable react/prop-types */
import { createContext, useContext, useState } from 'react';
import { useData } from './DataContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { users } = useData();
  const [user, setUser] = useState(null);

  const login = (role) => {
    const foundUser = users.find(u => u.role === role);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

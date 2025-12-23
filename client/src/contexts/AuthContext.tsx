import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: { id: string; email: string } | null;
  loading: boolean;
  setUser: (user: { id: string; email: string } | null) => void;
  signOut: () => void;
  handleAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user and token are stored
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("🔄 Restored user from storage:", parsedUser);
        // Don't verify token on mount - let API calls handle it
        // This avoids unnecessary requests and race conditions
      } catch (e) {
        // Invalid stored data, clear it
        console.log("❌ Invalid stored user data, clearing...");
        clearAuthData();
      }
    } else {
      // No token or user, clear any stale data
      console.log("🚫 No stored user or token found");
      clearAuthData();
    }
    setLoading(false);
  }, []);

  const clearAuthData = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  };

  const signOut = () => {
    clearAuthData();
    // Redirect will be handled by ProtectedRoute
  };

  const handleAuthError = () => {
    clearAuthData();
    // Redirect will be handled by ProtectedRoute detecting no user
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signOut, handleAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

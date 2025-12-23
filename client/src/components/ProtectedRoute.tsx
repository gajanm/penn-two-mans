import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, handleAuthError } = useAuth();
  const [, setLocation] = useLocation();
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // Check if token exists
    const token = getAuthToken();
    
    if (!token) {
      // No token, redirect to auth
      handleAuthError();
      return;
    }

    if (!loading) {
      if (!user) {
        // No user but we have a token - might be expired, let API calls handle it
        setCheckingToken(false);
      } else {
        // User exists, allow access
        setCheckingToken(false);
      }
    }
  }, [user, loading, handleAuthError]);

  useEffect(() => {
    if (!loading && !user && !checkingToken) {
      setLocation("/auth");
    }
  }, [user, loading, checkingToken, setLocation]);

  if (loading || checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  gender: string | null;
  graduation_year: string | null;
  major: string | null;
  survey_completed: boolean;
}

export default function Users() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    // Get token from sessionStorage/localStorage if available
    const storedToken = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Registered Users</h1>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Error loading users: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}

        {users.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No users registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Gender</th>
                  <th className="px-6 py-3 text-left font-semibold">Major</th>
                  <th className="px-6 py-3 text-left font-semibold">Graduation Year</th>
                  <th className="px-6 py-3 text-left font-semibold">Survey</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{u.email}</td>
                    <td className="px-6 py-4">{u.full_name || "—"}</td>
                    <td className="px-6 py-4">{u.gender || "—"}</td>
                    <td className="px-6 py-4">{u.major || "—"}</td>
                    <td className="px-6 py-4">{u.graduation_year || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        u.survey_completed
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.survey_completed ? "✓ Done" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground">
          Total users: <strong>{users.length}</strong>
        </div>
      </div>
    </div>
  );
}

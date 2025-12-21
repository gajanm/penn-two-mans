import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Survey from "@/pages/Survey";
import Dashboard from "@/pages/Dashboard";
import PartnerSelect from "@/pages/PartnerSelect";
import MatchReveal from "@/pages/MatchReveal";
import Chat from "@/pages/Chat";
import DateIdeas from "@/pages/DateIdeas";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import { AnimatePresence } from "framer-motion";
import React from "react";
import Layout from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={Auth} />
        <Route path="/survey">
          <ProtectedRoute>
            <Survey />
          </ProtectedRoute>
        </Route>
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/partner">
          <ProtectedRoute>
            <Layout><PartnerSelect /></Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/match">
          <ProtectedRoute>
            <Layout><MatchReveal /></Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/chat">
          <ProtectedRoute>
            <Layout><Chat /></Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/dates">
          <ProtectedRoute>
            <Layout><DateIdeas /></Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/users">
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

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
import { AnimatePresence } from "framer-motion";
import React from "react";
import Layout from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={Auth} />
        <Route path="/survey" component={Survey} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/dashboard">
          <Layout><Dashboard /></Layout>
        </Route>
        <Route path="/partner">
          <Layout><PartnerSelect /></Layout>
        </Route>
        <Route path="/match">
          <Layout><MatchReveal /></Layout>
        </Route>
        <Route path="/chat">
          <Layout><Chat /></Layout>
        </Route>
        <Route path="/dates">
          <Layout><DateIdeas /></Layout>
        </Route>
        <Route path="/settings">
          <Layout><Settings /></Layout>
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

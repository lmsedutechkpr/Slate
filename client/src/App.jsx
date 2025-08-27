import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import NotFound from "@/pages/not-found";
import Redirect from "@/components/Common/Redirect.jsx";
import Login from "@/pages/Login.jsx";
import Register from "@/pages/Register.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import Onboarding from "@/pages/Onboarding.jsx";
import Courses from "@/pages/Courses.jsx";
import Assignments from "@/pages/Assignments.jsx";
import Progress from "@/pages/Progress.jsx";
import Store from "@/pages/Store.jsx";
import Profile from "@/pages/Profile.jsx";
import AdminDashboard from "@/pages/AdminDashboard.jsx";
import InstructorDashboard from "@/pages/InstructorDashboard.jsx";
import ProtectedRoute from "@/components/Auth/ProtectedRoute.jsx";
import Navbar from "@/components/Layout/Navbar.jsx";
import MobileBottomNav from "@/components/Layout/MobileBottomNav.jsx";
import { useAuth } from "./hooks/useAuth.js";

function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      
      <Switch>
        {/* Public Routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Protected Routes */}
        <Route path="/onboarding">
          <ProtectedRoute requiredRole="student">
            <Onboarding />
          </ProtectedRoute>
        </Route>
        
        <Route path="/dashboard">
          <ProtectedRoute requiredRole="student">
            <Dashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/courses">
          <ProtectedRoute requiredRole="student">
            <Courses />
          </ProtectedRoute>
        </Route>
        
        <Route path="/assignments">
          <ProtectedRoute requiredRole="student">
            <Assignments />
          </ProtectedRoute>
        </Route>
        
        <Route path="/progress">
          <ProtectedRoute requiredRole="student">
            <Progress />
          </ProtectedRoute>
        </Route>
        
        <Route path="/store">
          <ProtectedRoute requiredRole="student">
            <Store />
          </ProtectedRoute>
        </Route>

        <Route path="/profile">
          <ProtectedRoute requiredRole="student">
            <Profile />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin">
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/instructor">
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        </Route>
        
        {/* Default route: redirect */}
        <Route path="/">
          {!isAuthenticated ? <Redirect to="/login" /> : <Redirect to="/dashboard" />}
        </Route>
        
        {/* 404 fallback */}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

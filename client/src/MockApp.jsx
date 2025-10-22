import React from 'react';
import { Switch, Route } from "wouter";
import { AuthProvider } from "./contexts/MockAuthContext.jsx";
import MockLogin from "./pages/MockLogin.jsx";
import MockDashboard from "./pages/MockDashboard.jsx";

// Simple Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    return <MockLogin />;
  }
  
  return children;
};

// Simple Admin Route component
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user || user.role !== 'admin') {
    return <MockLogin />;
  }
  
  return children;
};

// Simple Instructor Route component
const InstructorRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user || user.role !== 'instructor') {
    return <MockLogin />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Switch>
          {/* Public Routes */}
          <Route path="/login" component={MockLogin} />
          
          {/* Protected Routes */}
          <Route path="/dashboard">
            <ProtectedRoute>
              <MockDashboard />
            </ProtectedRoute>
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard">
            <AdminRoute>
              <MockDashboard />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/users">
            <AdminRoute>
              <MockDashboard />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/courses">
            <AdminRoute>
              <MockDashboard />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/instructors">
            <AdminRoute>
              <MockDashboard />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/analytics">
            <AdminRoute>
              <MockDashboard />
            </AdminRoute>
          </Route>
          
          <Route path="/admin/settings">
            <AdminRoute>
              <MockDashboard />
            </AdminRoute>
          </Route>
          
          {/* Instructor Routes */}
          <Route path="/instructor/dashboard">
            <InstructorRoute>
              <MockDashboard />
            </InstructorRoute>
          </Route>
          
          <Route path="/instructor/courses">
            <InstructorRoute>
              <MockDashboard />
            </InstructorRoute>
          </Route>
          
          <Route path="/instructor/students">
            <InstructorRoute>
              <MockDashboard />
            </InstructorRoute>
          </Route>
          
          <Route path="/instructor/analytics">
            <InstructorRoute>
              <MockDashboard />
            </InstructorRoute>
          </Route>
          
          {/* Student Routes */}
          <Route path="/courses">
            <ProtectedRoute>
              <MockDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/assignments">
            <ProtectedRoute>
              <MockDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/progress">
            <ProtectedRoute>
              <MockDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/store">
            <ProtectedRoute>
              <MockDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/profile">
            <ProtectedRoute>
              <MockDashboard />
            </ProtectedRoute>
          </Route>
          
          {/* Default Route */}
          <Route path="/">
            <MockLogin />
          </Route>
          
          {/* Catch all */}
          <Route>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <a 
                  href="/login" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </div>
    </AuthProvider>
  );
}

export default App;

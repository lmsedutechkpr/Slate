import { Switch, Route } from "wouter";
import { useLocation } from "wouter";
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
import AdminStudents from "@/pages/AdminStudents.jsx";
import AdminCourses from "@/pages/AdminCourses.jsx";
import AdminInstructors from "@/pages/AdminInstructors.jsx";
import AdminAnalytics from "@/pages/AdminAnalytics.jsx";
import AdminSettings from "@/pages/AdminSettings.jsx";
import AdminUsers from "@/pages/AdminUsers.jsx";
import AdminAuditLogs from "@/pages/AdminAuditLogs.jsx";
import AdminCourseDetail from "@/pages/AdminCourseDetail.jsx";
import AdminInstructorDetail from "@/pages/AdminInstructorDetail.jsx";
import AdminStudentReport from "@/pages/AdminStudentReport.jsx";
import AdminProfile from "@/pages/AdminProfile.jsx";
import InstructorDashboard from "@/pages/InstructorDashboard.jsx";
import ProtectedRoute from "@/components/Auth/ProtectedRoute.jsx";
import AdminLayout from "@/components/Admin/AdminLayout.jsx";
import Navbar from "@/components/Layout/Navbar.jsx";
import MobileBottomNav from "@/components/Layout/MobileBottomNav.jsx";
import { useAuth } from "./hooks/useAuth.js";
import CourseDetail from './pages/CourseDetail.jsx';
import AssignmentDetail from './pages/AssignmentDetail.jsx';

function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && !isAdminRoute && <Navbar />}
      
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
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/courses">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <Courses />
          </ProtectedRoute>
        </Route>
        <Route path="/courses/:courseId">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <CourseDetail />
          </ProtectedRoute>
        </Route>
        
        <Route path="/assignments">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <Assignments />
          </ProtectedRoute>
        </Route>
        <Route path="/assignments/:assignmentId">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <AssignmentDetail />
          </ProtectedRoute>
        </Route>
        
        <Route path="/progress">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <Progress />
          </ProtectedRoute>
        </Route>
        
        <Route path="/store">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <Store />
          </ProtectedRoute>
        </Route>

        <Route path="/profile">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <Profile />
          </ProtectedRoute>
        </Route>
        
        {/* Admin Routes - Wrapped with AdminLayout */}
        <Route path="/admin">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/students">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminStudents />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/students/:id">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminStudentReport />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/profile">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/courses">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminCourses />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/courses/:id">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminCourseDetail />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/instructors">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminInstructors />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/instructors/:id">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminInstructorDetail />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/analytics">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/audit-logs">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminAuditLogs />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/settings">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/users">
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/instructor">
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/courses">
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/assignments">
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/live">
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/students">
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/settings">
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        </Route>
        
        {/* Default route: redirect */}
        <Route path="/">
          {!isAuthenticated ? (
            <Redirect to="/login" />
          ) : user?.role === 'admin' ? (
            <Redirect to="/admin" />
          ) : user?.role === 'instructor' ? (
            <Redirect to="/instructor" />
          ) : user?.role === 'student' && !user?.completedOnboarding ? (
            <Redirect to="/onboarding" />
          ) : (
            <Redirect to="/dashboard" />
          )}
        </Route>
        
        {/* 404 fallback */}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && !isAdminRoute && <MobileBottomNav />}
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

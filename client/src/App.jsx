import { Switch, Route } from "wouter";
import { Suspense, lazy } from 'react';
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import NotFound from "@/pages/not-found";
import Redirect from "@/components/Common/Redirect.jsx";
import LandingPage from "@/pages/LandingPage.jsx";
import Login from "@/pages/Login.jsx";
import Register from "@/pages/Register.jsx";
const Dashboard = lazy(() => import('@/pages/Dashboard.jsx'));
const Onboarding = lazy(() => import('@/pages/Onboarding.jsx'));
const Courses = lazy(() => import('@/pages/Courses.jsx'));
const Assignments = lazy(() => import('@/pages/Assignments.jsx'));
const Progress = lazy(() => import('@/pages/Progress.jsx'));
const Store = lazy(() => import('@/pages/Store.jsx'));
const Profile = lazy(() => import('@/pages/Profile.jsx'));
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
const CourseDetail = lazy(() => import('./pages/CourseDetail.jsx'));
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
import InstructorAnalytics from './pages/InstructorAnalytics.jsx';
import InstructorLayout from "@/components/Instructor/InstructorLayout.jsx";
import InstructorCourses from "@/pages/InstructorCourses.jsx";
import InstructorCourseContent from "@/pages/InstructorCourseContent.jsx";
import InstructorStudents from "@/pages/InstructorStudents.jsx";
import InstructorSettings from "@/pages/InstructorSettings.jsx";
import LiveSessions from './components/Instructor/LiveSessions.jsx';
import InstructorAssignments from './components/Instructor/Assignments.jsx';
import CommunicationCenter from './components/Instructor/CommunicationCenter.jsx';
import AdvancedAnalytics from './components/Instructor/AdvancedAnalytics.jsx';
import ContentManagement from './components/Instructor/ContentManagement.jsx';
import AttendanceTracker from './components/Instructor/AttendanceTracker.jsx';
import Gradebook from './components/Instructor/Gradebook.jsx';
import LiveSessionManager from './components/Instructor/LiveSessionManager.jsx';
import QuizBuilder from './components/Instructor/QuizBuilder.jsx';
import NotificationCenter from './components/Instructor/NotificationCenter.jsx';
import ReportingSystem from './components/Instructor/ReportingSystem.jsx';
import CalendarScheduler from './components/Instructor/CalendarScheduler.jsx';
import PlagiarismChecker from './components/Instructor/PlagiarismChecker.jsx';

function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  const isInstructorRoute = location.startsWith('/instructor');

  // Accessibility: move focus to main content on route change
  try {
    // Defer to end of tick to ensure element exists
    setTimeout(() => {
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.setAttribute('tabindex', '-1');
        mainEl.focus();
      }
    }, 0);
  } catch {}

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div id="main-content" className="min-h-screen bg-gray-50" role="main">
      {isAuthenticated && !isAdminRoute && !isInstructorRoute && <Navbar />}
      
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div></div>}>
      <Switch>
        {/* Public Routes */}
        <Route path="/landing" component={LandingPage} />
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

        <Route path="/settings">
          <ProtectedRoute requiredRole="student" requireOnboarded={true}>
            <Settings />
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
            <InstructorLayout>
              <InstructorDashboard />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/courses">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <InstructorCourses />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/instructor/courses/:courseId">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <InstructorCourseContent />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/assignments">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <InstructorAssignments />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/live">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <LiveSessions />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/students">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <InstructorStudents />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/settings">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <InstructorSettings />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/content">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <ContentManagement />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/gradebook">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <Gradebook />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/attendance">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <AttendanceTracker />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/communication">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <CommunicationCenter />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/quizzes">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <QuizBuilder />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/notifications">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <NotificationCenter />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/reports">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <ReportingSystem />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/calendar">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <CalendarScheduler />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        

        <Route path="/instructor/plagiarism">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <PlagiarismChecker />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/instructor/analytics">
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout>
              <AdvancedAnalytics />
            </InstructorLayout>
          </ProtectedRoute>
        </Route>
        
        {/* Default route: redirect */}
        <Route path="/">
          {!isAuthenticated ? (
            <Redirect to="/landing" />
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
      </Suspense>
      
      {isAuthenticated && !isAdminRoute && !isInstructorRoute && <MobileBottomNav />}
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

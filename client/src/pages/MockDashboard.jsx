import React from 'react';
import { useAuth } from '../contexts/MockAuthContext.jsx';
import { mockAPI } from '../data/dummyData.js';

const MockDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = React.useState({
    courses: [],
    analytics: null,
    loading: true
  });

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [courses, analytics] = await Promise.all([
          mockAPI.getCourses(),
          mockAPI.getAnalytics()
        ]);
        
        setData({
          courses: courses.slice(0, 4), // Show first 4 courses
          analytics,
          loading: false
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    loadData();
  }, []);

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Total Users</h4>
                  <p className="text-2xl font-bold text-blue-600">{data.analytics.overview.totalUsers}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Total Revenue</h4>
                  <p className="text-2xl font-bold text-green-600">${data.analytics.overview.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Active Users</h4>
                  <p className="text-2xl font-bold text-purple-600">{data.analytics.overview.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Courses</h3>
              <div className="space-y-3">
                {data.courses.map(course => (
                  <div key={course.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <img src={course.coverUrl} alt={course.title} className="w-16 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{course.title}</h4>
                      <p className="text-sm text-gray-600">{course.enrollmentCount} enrollments • {course.rating}⭐</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${course.price}</p>
                      <p className="text-sm text-gray-600">{course.level}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'instructor':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">My Courses</h4>
                  <p className="text-2xl font-bold text-blue-600">{user.coursesCount || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Total Students</h4>
                  <p className="text-2xl font-bold text-green-600">{user.studentsCount || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Average Rating</h4>
                  <p className="text-2xl font-bold text-purple-600">{user.rating || 0}⭐</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>
              <div className="space-y-3">
                {data.courses.filter(course => course.instructor.id === user.id).map(course => (
                  <div key={course.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <img src={course.coverUrl} alt={course.title} className="w-16 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{course.title}</h4>
                      <p className="text-sm text-gray-600">{course.enrollmentCount} students • {course.avgProgressPct}% avg progress</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{course.rating}⭐</p>
                      <p className="text-sm text-gray-600">{course.reviewCount} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default: // student
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Enrolled Courses</h4>
                  <p className="text-2xl font-bold text-blue-600">{user.enrolledCourses || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Completed</h4>
                  <p className="text-2xl font-bold text-green-600">{user.completedCourses || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Total XP</h4>
                  <p className="text-2xl font-bold text-purple-600">{user.totalXP || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.courses.map(course => (
                  <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img src={course.coverUrl} alt={course.title} className="w-full h-32 object-cover rounded mb-3" />
                    <h4 className="font-medium text-gray-900 mb-2">{course.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{course.description.substring(0, 100)}...</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>{course.enrollmentCount} students • {course.rating}⭐</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${course.price}</p>
                        <p className="text-xs text-gray-600">{course.level}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Slate LMS</h1>
              <p className="text-sm text-gray-600">Learning Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
              <img src={user?.profile?.avatar} alt="Profile" className="w-8 h-8 rounded-full" />
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.profile?.firstName}! 👋
          </h2>
          <p className="text-gray-600 mt-2">
            Welcome to your {user?.role} dashboard
          </p>
        </div>

        {getRoleSpecificContent()}

        {/* Demo Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Demo Mode
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This is a demo version with dummy data. All functionality is simulated for demonstration purposes.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MockDashboard;

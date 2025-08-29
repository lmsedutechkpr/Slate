import EnhancedCourseManagement from '../components/Admin/EnhancedCourseManagement.jsx';

const AdminCourses = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
        <p className="text-gray-600">Create, edit, and manage all courses in the platform</p>
      </div>
      
      <EnhancedCourseManagement />
    </div>
  );
};

export default AdminCourses;


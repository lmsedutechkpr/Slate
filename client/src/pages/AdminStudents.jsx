import StudentAnalytics from '../components/Admin/StudentAnalytics.jsx';

const AdminStudents = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
        <p className="text-gray-600">Monitor student performance and manage enrollments</p>
      </div>
      
      <StudentAnalytics />
    </div>
  );
};

export default AdminStudents;


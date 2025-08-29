import InstructorManagement from '../components/Admin/InstructorManagement.jsx';

const AdminInstructors = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Instructor Management</h1>
        <p className="text-gray-600">Manage instructors and course assignments</p>
      </div>
      
      <InstructorManagement />
    </div>
  );
};

export default AdminInstructors;


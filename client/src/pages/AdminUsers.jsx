import UserManagement from '../components/Admin/UserManagement.jsx';

const AdminUsers = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage all users, roles, and permissions</p>
      </div>

      <UserManagement />
    </div>
  );
};

export default AdminUsers;

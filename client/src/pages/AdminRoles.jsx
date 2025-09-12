import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  GraduationCap,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

const AdminRoles = () => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Mock roles and permissions data
  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access and control',
      color: 'bg-red-100 text-red-700',
      icon: <Shield className="h-4 w-4" />,
      userCount: 3,
      permissions: {
        'user_management': { read: true, write: true, delete: true },
        'course_management': { read: true, write: true, delete: true },
        'instructor_management': { read: true, write: true, delete: true },
        'analytics': { read: true, write: false, delete: false },
        'settings': { read: true, write: true, delete: false },
        'reports': { read: true, write: true, delete: true }
      }
    },
    {
      id: 'instructor',
      name: 'Instructor',
      description: 'Can manage courses and students',
      color: 'bg-blue-100 text-blue-700',
      icon: <Users className="h-4 w-4" />,
      userCount: 12,
      permissions: {
        'user_management': { read: true, write: false, delete: false },
        'course_management': { read: true, write: true, delete: false },
        'instructor_management': { read: false, write: false, delete: false },
        'analytics': { read: true, write: false, delete: false },
        'settings': { read: false, write: false, delete: false },
        'reports': { read: true, write: false, delete: false }
      }
    },
    {
      id: 'student',
      name: 'Student',
      description: 'Can access courses and learning materials',
      color: 'bg-green-100 text-green-700',
      icon: <GraduationCap className="h-4 w-4" />,
      userCount: 245,
      permissions: {
        'user_management': { read: false, write: false, delete: false },
        'course_management': { read: true, write: false, delete: false },
        'instructor_management': { read: false, write: false, delete: false },
        'analytics': { read: false, write: false, delete: false },
        'settings': { read: false, write: false, delete: false },
        'reports': { read: false, write: false, delete: false }
      }
    }
  ];

  const permissionCategories = [
    {
      id: 'user_management',
      name: 'User Management',
      description: 'Manage users, roles, and permissions'
    },
    {
      id: 'course_management',
      name: 'Course Management',
      description: 'Create, edit, and manage courses'
    },
    {
      id: 'instructor_management',
      name: 'Instructor Management',
      description: 'Manage instructor accounts and assignments'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'View system analytics and reports'
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Configure system-wide settings'
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Generate and manage reports'
    }
  ];

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  const handlePermissionChange = (category, permission, value) => {
    console.log(`Changing ${category}.${permission} to ${value} for role ${selectedRole}`);
    // Here you would implement the actual permission update logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-gray-600">Define roles and manage permissions across the platform</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new role with custom permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input id="role-name" placeholder="Enter role name" />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Input id="role-description" placeholder="Enter role description" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Select a role to manage its permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole === role.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${role.color}`}>
                      {role.icon}
                    </div>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.userCount} users</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permission Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedRoleData?.icon}
                  {selectedRoleData?.name} Permissions
                </CardTitle>
                <CardDescription>
                  {selectedRoleData?.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <EyeOff className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? 'View' : 'Edit'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="permissions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="users">Users ({selectedRoleData?.userCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="permissions" className="space-y-6">
                {permissionCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="mb-4">
                      <h4 className="font-medium text-lg">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Read
                        </Label>
                        <Switch
                          checked={selectedRoleData?.permissions[category.id]?.read || false}
                          onCheckedChange={(checked) => handlePermissionChange(category.id, 'read', checked)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Write
                        </Label>
                        <Switch
                          checked={selectedRoleData?.permissions[category.id]?.write || false}
                          onCheckedChange={(checked) => handlePermissionChange(category.id, 'write', checked)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Label>
                        <Switch
                          checked={selectedRoleData?.permissions[category.id]?.delete || false}
                          onCheckedChange={(checked) => handlePermissionChange(category.id, 'delete', checked)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  User list for this role will be displayed here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
          <CardDescription>
            Overview of permissions across all roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Permission</th>
                  {roles.map((role) => (
                    <th key={role.id} className="text-center p-2">
                      <div className="flex items-center justify-center gap-2">
                        {role.icon}
                        {role.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionCategories.map((category) => (
                  <tr key={category.id} className="border-b">
                    <td className="p-2 font-medium">{category.name}</td>
                    {roles.map((role) => (
                      <td key={role.id} className="p-2 text-center">
                        <div className="flex justify-center gap-1">
                          {role.permissions[category.id]?.read && (
                            <Badge variant="outline" className="text-xs">R</Badge>
                          )}
                          {role.permissions[category.id]?.write && (
                            <Badge variant="outline" className="text-xs">W</Badge>
                          )}
                          {role.permissions[category.id]?.delete && (
                            <Badge variant="outline" className="text-xs">D</Badge>
                          )}
                          {!role.permissions[category.id]?.read && 
                           !role.permissions[category.id]?.write && 
                           !role.permissions[category.id]?.delete && (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoles;

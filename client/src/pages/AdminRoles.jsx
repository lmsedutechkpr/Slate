import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { useRealtimeInvalidate } from '../lib/useRealtimeInvalidate.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  GraduationCap,
  Settings,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

const AdminRoles = () => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [createRoleData, setCreateRoleData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'shield'
  });

  // Fetch roles and permissions data
  const { data: rolesData, isLoading, isFetching } = useQuery({
    queryKey: ['/api/admin/roles', accessToken],
    queryFn: async () => {
      console.log('Fetching roles and permissions data...');
      const response = await fetch(buildApiUrl('/api/admin/roles'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      const data = await response.json();
      console.log('Roles data fetched:', data);
      return data;
    },
    enabled: !!accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  const roles = rolesData?.roles || [];
  const permissionModules = rolesData?.modules || {};

  // Real-time updates
  useRealtimeInvalidate(
    ['/api/admin/roles'], 
    ['roles:update', 'roles:create', 'roles:delete', 'roles:permissions', 'users:update']
  );

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData) => {
      console.log('Creating role:', roleData);
      const response = await fetch(buildApiUrl('/api/admin/roles'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create role:', errorData);
        throw new Error(errorData.message || 'Failed to create role');
      }
      
      const result = await response.json();
      console.log('Role created successfully:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Role creation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setShowCreateDialog(false);
      setCreateRoleData({ name: '', description: '', color: '#3B82F6', icon: 'shield' });
      toast({ title: 'Role created successfully' });
    },
    onError: (error) => {
      console.error('Role creation error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, roleData }) => {
      const response = await fetch(buildApiUrl(`/api/admin/roles/${roleId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setIsEditing(false);
      setEditingPermissions({});
      toast({ title: 'Role updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ roleId, module, action, granted }) => {
      const response = await fetch(buildApiUrl(`/api/admin/roles/${roleId}/permissions`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ module, action, granted })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update permission');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId) => {
      const response = await fetch(buildApiUrl(`/api/admin/roles/${roleId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setSelectedRole(null);
      toast({ title: 'Role deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Initialize system roles
  const initializeRolesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(buildApiUrl('/api/admin/roles/initialize'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize roles');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      toast({ title: 'System roles initialized successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const selectedRoleData = selectedRole ? roles.find(role => role._id === selectedRole) : null;

  // Initialize editing permissions when role is selected
  useEffect(() => {
    if (selectedRoleData && isEditing) {
      const permissions = {};
      selectedRoleData.permissions.forEach(perm => {
        permissions[perm.module] = {};
        perm.actions.forEach(action => {
          permissions[perm.module][action] = true;
        });
      });
      setEditingPermissions(permissions);
    }
  }, [selectedRoleData, isEditing]);

  const handlePermissionChange = (module, action, value) => {
    if (isEditing) {
      setEditingPermissions(prev => ({
        ...prev,
        [module]: {
          ...prev[module],
          [action]: value
        }
      }));
    } else {
      updatePermissionMutation.mutate({
        roleId: selectedRole,
        module,
        action,
        granted: value
      });
    }
  };

  const handleSavePermissions = () => {
    if (!selectedRoleData) return;

    const permissions = [];
    Object.entries(editingPermissions).forEach(([module, actions]) => {
      const moduleActions = Object.entries(actions)
        .filter(([_, granted]) => granted)
        .map(([action, _]) => action);
      
      if (moduleActions.length > 0) {
        permissions.push({ module, actions: moduleActions });
      }
    });

    updateRoleMutation.mutate({
      roleId: selectedRole,
      roleData: {
        ...selectedRoleData,
        permissions
      }
    });
  };

  const handleCreateRole = () => {
    const permissions = [];
    Object.entries(editingPermissions).forEach(([module, actions]) => {
      const moduleActions = Object.entries(actions)
        .filter(([_, granted]) => granted)
        .map(([action, _]) => action);
      
      if (moduleActions.length > 0) {
        permissions.push({ module, actions: moduleActions });
      }
    });

    createRoleMutation.mutate({
      ...createRoleData,
      permissions
    });
  };

  const getRoleIcon = (iconName) => {
    switch (iconName) {
      case 'shield': return <Shield className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'graduation-cap': return <GraduationCap className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getPermissionGroups = () => {
    return [
      {
        title: 'User & Instructor Management',
        modules: ['USER_MANAGEMENT', 'INSTRUCTOR_MANAGEMENT']
      },
      {
        title: 'Learning Management',
        modules: ['COURSE_MANAGEMENT']
      },
      {
        title: 'Store Management',
        modules: ['STORE_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'ORDER_MANAGEMENT', 'INVENTORY_MANAGEMENT']
      },
      {
        title: 'Administration',
        modules: ['ANALYTICS', 'SYSTEM_SETTINGS', 'REPORTS']
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Role & Permission Management</h1>
            <p className="text-gray-600">Define roles and manage permissions across the platform</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-gray-600">Define roles and manage permissions across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] })}
            title="Refresh data"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          {roles.length === 0 && (
            <Button
              onClick={() => initializeRolesMutation.mutate()}
              variant="outline"
              disabled={initializeRolesMutation.isPending}
            >
              {initializeRolesMutation.isPending ? 'Initializing...' : 'Initialize System Roles'}
            </Button>
          )}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with custom permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input 
                      id="role-name" 
                      placeholder="Enter role name"
                      value={createRoleData.name}
                      onChange={(e) => setCreateRoleData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-color">Color</Label>
                    <Input 
                      id="role-color" 
                      type="color"
                      value={createRoleData.color}
                      onChange={(e) => setCreateRoleData(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role-description">Description</Label>
                  <Input 
                    id="role-description" 
                    placeholder="Enter role description"
                    value={createRoleData.description}
                    onChange={(e) => setCreateRoleData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-4">
                    {getPermissionGroups().map((group) => (
                      <div key={group.title}>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">{group.title}</h4>
                        <div className="space-y-2">
                          {group.modules.map((moduleKey) => {
                            const module = permissionModules[moduleKey];
                            if (!module) return null;
                            return (
                              <div key={moduleKey} className="border rounded p-3">
                                <div className="font-medium text-sm mb-2">{module.name}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {module.actions.map((action) => (
                                    <div key={action} className="flex items-center space-x-2">
                                      <Switch
                                        checked={editingPermissions[moduleKey]?.[action] || false}
                                        onCheckedChange={(checked) => {
                                          setEditingPermissions(prev => ({
                                            ...prev,
                                            [moduleKey]: {
                                              ...prev[moduleKey],
                                              [action]: checked
                                            }
                                          }));
                                        }}
                                      />
                                      <Label className="text-xs capitalize">
                                        {action.replace('_', ' ')}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRole}
                    disabled={createRoleMutation.isPending || !createRoleData.name || !createRoleData.description}
                  >
                    {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Roles ({roles.length})</CardTitle>
            <CardDescription>
              Select a role to manage its permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No roles found</p>
                <p className="text-sm">Click "Initialize System Roles" to get started</p>
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === role._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRole(role._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-full text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        {getRoleIcon(role.icon)}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {role.name}
                          {role.isSystemRole && (
                            <Badge variant="outline" className="text-xs">System</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{role.userCount} users</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(!isEditing);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!role.isSystemRole && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Role</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{role.name}" role? 
                                {role.userCount > 0 && (
                                  <span className="block mt-2 text-red-600 font-medium">
                                    This role has {role.userCount} users assigned. They will need to be reassigned first.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteRoleMutation.mutate(role._id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={role.userCount > 0}
                              >
                                Delete Role
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Permission Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedRoleData ? getRoleIcon(selectedRoleData.icon) : <Shield className="h-5 w-5" />}
                  {selectedRoleData?.name || 'Select a Role'} Permissions
                </CardTitle>
                <CardDescription>
                  {selectedRoleData?.description || 'Choose a role to manage its permissions'}
                </CardDescription>
              </div>
              {selectedRoleData && !selectedRoleData.isSystemRole && (
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
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRoleData ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a role to manage its permissions</p>
              </div>
            ) : (
              <Tabs defaultValue="permissions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="users">Users ({selectedRoleData.userCount})</TabsTrigger>
                </TabsList>

                <TabsContent value="permissions" className="space-y-6">
                  {isEditing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Edit Mode</h4>
                          <p className="text-sm text-blue-700">Make your changes and click Save to apply them</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditing(false);
                              setEditingPermissions({});
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSavePermissions}
                            disabled={updateRoleMutation.isPending}
                          >
                            {updateRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {getPermissionGroups().map((group) => (
                    <div key={group.title} className="border rounded-lg p-4">
                      <div className="mb-4">
                        <h4 className="font-medium text-lg">{group.title}</h4>
                      </div>
                      <div className="space-y-4">
                        {group.modules.map((moduleKey) => {
                          const module = permissionModules[moduleKey];
                          if (!module) return null;
                          
                          const currentPermissions = selectedRoleData.permissions.find(p => p.module === moduleKey);
                          const hasPermission = (action) => {
                            if (isEditing) {
                              return editingPermissions[moduleKey]?.[action] || false;
                            }
                            return currentPermissions?.actions.includes(action) || false;
                          };
                          
                          return (
                            <div key={moduleKey} className="border rounded p-4">
                              <div className="mb-3">
                                <h5 className="font-medium text-sm">{module.name}</h5>
                                <p className="text-xs text-gray-600">{module.description}</p>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {module.actions.map((action) => (
                                  <div key={action} className="flex items-center space-x-2">
                                    <Switch
                                      checked={hasPermission(action)}
                                      onCheckedChange={(checked) => handlePermissionChange(moduleKey, action, checked)}
                                      disabled={!isEditing && selectedRoleData.isSystemRole}
                                    />
                                    <Label className="text-xs capitalize">
                                      {action.replace('_', ' ')}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>User list for this role will be displayed here</p>
                    <p className="text-sm">This feature will show all users assigned to the selected role</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
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
          {roles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No roles to display summary</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Permission</th>
                    {roles.map((role) => (
                      <th key={role._id} className="text-center p-2">
                        <div className="flex items-center justify-center gap-2">
                          {getRoleIcon(role.icon)}
                          <span className="text-sm">{role.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getPermissionGroups().map((group) => (
                    <tr key={group.title} className="border-b">
                      <td className="p-2 font-medium">{group.title}</td>
                      {roles.map((role) => {
                        const rolePermissions = role.permissions || [];
                        const hasAnyPermission = group.modules.some(moduleKey => 
                          rolePermissions.some(perm => perm.module === moduleKey && perm.actions.length > 0)
                        );
                        
                        return (
                          <td key={role._id} className="p-2 text-center">
                            {hasAnyPermission ? (
                              <div className="flex justify-center gap-1 flex-wrap">
                                {group.modules.map((moduleKey) => {
                                  const modulePerm = rolePermissions.find(p => p.module === moduleKey);
                                  if (!modulePerm) return null;
                                  
                                  return modulePerm.actions.map((action) => (
                                    <Badge key={action} variant="outline" className="text-xs">
                                      {action.charAt(0).toUpperCase()}
                                    </Badge>
                                  ));
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoles;

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const AdminSettings = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Learning Management System',
    platformDescription: 'Modern learning platform for students and instructors',
    contactEmail: 'admin@lms.com',
    supportPhone: '+1-555-0123',
    timezone: 'UTC',
    language: 'en',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    twoFactorAuth: false,
    ipWhitelist: '',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4'],
    maxFileSize: 50
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    courseUpdates: true,
    assignmentReminders: true,
    systemAlerts: true,
    marketingEmails: false,
    digestFrequency: 'weekly'
  });

  const [rolePermissions, setRolePermissions] = useState({
    student: {
      viewCourses: true,
      enrollCourses: true,
      submitAssignments: true,
      viewProgress: true,
      editProfile: true
    },
    instructor: {
      createCourses: true,
      editOwnCourses: true,
      gradeAssignments: true,
      viewStudentProgress: true,
      manageContent: true
    },
    admin: {
      manageUsers: true,
      manageCourses: true,
      viewAnalytics: true,
      systemSettings: false,
      manageRoles: false
    },
    'super-admin': {
      manageUsers: true,
      manageCourses: true,
      viewAnalytics: true,
      systemSettings: true,
      manageRoles: true
    }
  });

  // Load settings from server on mount
  const { data: loadedSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/admin/settings'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    },
    enabled: !!accessToken
  });

  useEffect(() => {
    if (!loadedSettings) return;
    const { general, security, notifications, roles } = loadedSettings;
    if (general) setGeneralSettings(prev => ({ ...prev, ...general }));
    if (security) setSecuritySettings(prev => ({ ...prev, ...security }));
    if (notifications) setNotificationSettings(prev => ({ ...prev, ...notifications }));
    if (roles) setRolePermissions(prev => ({ ...prev, ...roles }));
  }, [loadedSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      const response = await fetch(buildApiUrl('/api/admin/settings'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveSettingsMutation.mutateAsync({
        general: generalSettings,
        security: securitySettings,
        notifications: notificationSettings,
        roles: rolePermissions
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateRolePermission = (role, permission, value) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value
      }
    }));
  };

  const resetToDefaults = () => {
    // Reset all settings to default values
    setGeneralSettings({
      platformName: 'Learning Management System',
      platformDescription: 'Modern learning platform for students and instructors',
      contactEmail: 'admin@lms.com',
      supportPhone: '+1-555-0123',
      timezone: 'UTC',
      language: 'en',
      maintenanceMode: false,
      allowRegistrations: true,
      requireEmailVerification: true
    });
    
    setSecuritySettings({
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true,
      twoFactorAuth: false,
      ipWhitelist: '',
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4'],
      maxFileSize: 50
    });
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values",
    });
  };

  const PermissionRow = ({ permission, label, description, role, value, onChange }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={user?.role !== 'super-admin'}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap gap-2 sm:gap-3 p-1 bg-gray-100 rounded-lg md:grid md:grid-cols-4 md:overflow-visible md:whitespace-normal">
          <TabsTrigger value="general" className="flex items-center space-x-2 shrink-0 text-xs sm:text-sm px-3 py-2 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">
            <Settings className="w-4 h-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2 shrink-0 text-xs sm:text-sm px-3 py-2 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2 shrink-0 text-xs sm:text-sm px-3 py-2 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center space-x-2 shrink-0 text-xs sm:text-sm px-3 py-2 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">
            <Users className="w-4 h-4" />
            <span>Roles & Permissions</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Basic platform settings and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={generalSettings.platformName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    value={generalSettings.supportPhone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="platformDescription">Platform Description</Label>
                <Input
                  id="platformDescription"
                  value={generalSettings.platformDescription}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformDescription: e.target.value }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Temporarily disable platform access</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(value) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow New Registrations</Label>
                    <p className="text-sm text-gray-500">Enable user registration</p>
                  </div>
                  <Switch
                    checked={generalSettings.allowRegistrations}
                    onCheckedChange={(value) => setGeneralSettings(prev => ({ ...prev, allowRegistrations: value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-gray-500">Users must verify email before access</p>
                  </div>
                  <Switch
                    checked={generalSettings.requireEmailVerification}
                    onCheckedChange={(value) => setGeneralSettings(prev => ({ ...prev, requireEmailVerification: value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>Configure security settings and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={securitySettings.maxFileSize}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Strong Passwords</Label>
                    <p className="text-sm text-gray-500">Enforce complex password requirements</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireStrongPassword}
                    onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, requireStrongPassword: value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Enable 2FA for enhanced security</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ipWhitelist">IP Whitelist (optional)</Label>
                <Input
                  id="ipWhitelist"
                  placeholder="192.168.1.1, 10.0.0.0/24"
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                />
                <p className="text-sm text-gray-500 mt-1">Comma-separated IP addresses or CIDR ranges</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure system notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(value) => setNotificationSettings(prev => ({ ...prev, emailNotifications: value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Send browser push notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(value) => setNotificationSettings(prev => ({ ...prev, pushNotifications: value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Course Updates</Label>
                    <p className="text-sm text-gray-500">Notify about course changes</p>
                  </div>
                  <Switch
                    checked={notificationSettings.courseUpdates}
                    onCheckedChange={(value) => setNotificationSettings(prev => ({ ...prev, courseUpdates: value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Assignment Reminders</Label>
                    <p className="text-sm text-gray-500">Send assignment due reminders</p>
                  </div>
                  <Switch
                    checked={notificationSettings.assignmentReminders}
                    onCheckedChange={(value) => setNotificationSettings(prev => ({ ...prev, assignmentReminders: value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Alerts</Label>
                    <p className="text-sm text-gray-500">Important system notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(value) => setNotificationSettings(prev => ({ ...prev, systemAlerts: value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="digestFrequency">Digest Frequency</Label>
                <Select value={notificationSettings.digestFrequency} onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, digestFrequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
              <CardDescription>Configure permissions for different user roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(rolePermissions).map(([role, permissions]) => (
                <div key={role} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={role === 'super-admin' ? 'destructive' : 'default'}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                      {role === 'super-admin' && (
                        <span className="text-xs text-gray-500">Full system access</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(permissions).map(([permission, value]) => (
                      <PermissionRow
                        key={permission}
                        permission={permission}
                        label={permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        description={`Allow ${role}s to ${permission.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                        role={role}
                        value={value}
                        onChange={(newValue) => updateRolePermission(role, permission, newValue)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {user?.role !== 'super-admin' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      You need super-admin privileges to modify role permissions
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={resetToDefaults}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Save Status */}
      {saveSettingsMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">Settings saved successfully</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

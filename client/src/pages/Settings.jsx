import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '@/lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  Eye, 
  Download,
  Trash2,
  Save,
  Palette,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Settings() {
  const { user, accessToken, authenticatedFetch } = useAuth();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    // Appearance
    theme: 'light',
    fontSize: 'medium',
    compactMode: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    courseUpdates: true,
    assignmentReminders: true,
    achievementAlerts: true,
    liveSessionReminders: true,
    
    // Privacy
    profileVisibility: 'public',
    showProgress: true,
    showAchievements: true,
    allowMessages: true,
    
    // Accessibility
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    
    // Data
    autoSave: true,
    dataRetention: '1year'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      const res = await authenticatedFetch(buildApiUrl('/api/users/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Save failed');
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExportData = () => {
    // Export user data
    const data = {
      user: user,
      settings: settings,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slate-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion
      console.log('Account deletion requested');
    }
  };

  // Active sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['/api/sessions', accessToken],
    queryFn: async () => {
      const res = await authenticatedFetch(buildApiUrl('/api/sessions'));
      if (!res.ok) return { sessions: [] };
      return res.json();
    },
    enabled: !!accessToken
  });

  useRealtimeInvalidate([
    ['/api/sessions']
  ], ['sessions']);

  const signOutSession = useMutation({
    mutationFn: async (sessionId) => {
      const res = await authenticatedFetch(buildApiUrl(`/api/sessions/${sessionId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to sign out session');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['/api/sessions', accessToken])
  });

  const signOutAllSessions = useMutation({
    mutationFn: async () => {
      const res = await authenticatedFetch(buildApiUrl('/api/sessions'), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to sign out sessions');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['/api/sessions', accessToken])
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Customize your learning experience</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Sessions */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Active Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => signOutAllSessions.mutate()} disabled={signOutAllSessions.isLoading}>
                  Sign out of all devices
                </Button>
              </div>
              <div className="divide-y divide-gray-100">
                {(sessionsData?.sessions || []).length === 0 && (
                  <div className="text-sm text-gray-500">No other active sessions.</div>
                )}
                {(sessionsData?.sessions || []).map((s) => (
                  <div key={s._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.device || 'Unknown device'}</div>
                      <div className="text-xs text-gray-500">{s.ip || 'IP unknown'} • {new Date(s.lastActiveAt || s.createdAt).toLocaleString()}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => signOutSession.mutate(s._id)} disabled={signOutSession.isLoading}>Sign out</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={value => handleSettingChange('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center space-x-2">
                          <Sun className="w-4 h-4" />
                          <span>Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center space-x-2">
                          <Moon className="w-4 h-4" />
                          <span>Dark</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select value={settings.fontSize} onValueChange={value => handleSettingChange('fontSize', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compactMode">Compact Mode</Label>
                  <p className="text-sm text-gray-500">Reduce spacing for more content</p>
                </div>
                <Switch
                  id="compactMode"
                  checked={settings.compactMode}
                  onCheckedChange={value => handleSettingChange('compactMode', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={value => handleSettingChange('emailNotifications', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive browser notifications</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={value => handleSettingChange('pushNotifications', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="courseUpdates">Course Updates</Label>
                  <p className="text-sm text-gray-500">New content and announcements</p>
                </div>
                <Switch
                  id="courseUpdates"
                  checked={settings.courseUpdates}
                  onCheckedChange={value => handleSettingChange('courseUpdates', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="assignmentReminders">Assignment Reminders</Label>
                  <p className="text-sm text-gray-500">Due date notifications</p>
                </div>
                <Switch
                  id="assignmentReminders"
                  checked={settings.assignmentReminders}
                  onCheckedChange={value => handleSettingChange('assignmentReminders', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="liveSessionReminders">Live Session Reminders</Label>
                  <p className="text-sm text-gray-500">Reminders before live classes</p>
                </div>
                <Switch
                  id="liveSessionReminders"
                  checked={settings.liveSessionReminders}
                  onCheckedChange={value => handleSettingChange('liveSessionReminders', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="achievementAlerts">Achievement Alerts</Label>
                  <p className="text-sm text-gray-500">Badges and milestones</p>
                </div>
                <Switch
                  id="achievementAlerts"
                  checked={settings.achievementAlerts}
                  onCheckedChange={value => handleSettingChange('achievementAlerts', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="profileVisibility">Profile Visibility</Label>
                <Select value={settings.profileVisibility} onValueChange={value => handleSettingChange('profileVisibility', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showProgress">Show Learning Progress</Label>
                  <p className="text-sm text-gray-500">Allow others to see your progress</p>
                </div>
                <Switch
                  id="showProgress"
                  checked={settings.showProgress}
                  onCheckedChange={value => handleSettingChange('showProgress', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowMessages">Allow Messages</Label>
                  <p className="text-sm text-gray-500">Receive messages from other users</p>
                </div>
                <Switch
                  id="allowMessages"
                  checked={settings.allowMessages}
                  onCheckedChange={value => handleSettingChange('allowMessages', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Settings */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Accessibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="highContrast">High Contrast</Label>
                  <p className="text-sm text-gray-500">Increase color contrast</p>
                </div>
                <Switch
                  id="highContrast"
                  checked={settings.highContrast}
                  onCheckedChange={value => handleSettingChange('highContrast', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reduceMotion">Reduce Motion</Label>
                  <p className="text-sm text-gray-500">Minimize animations</p>
                </div>
                <Switch
                  id="reduceMotion"
                  checked={settings.reduceMotion}
                  onCheckedChange={value => handleSettingChange('reduceMotion', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="screenReader">Screen Reader Support</Label>
                  <p className="text-sm text-gray-500">Enhanced accessibility features</p>
                </div>
                <Switch
                  id="screenReader"
                  checked={settings.screenReader}
                  onCheckedChange={value => handleSettingChange('screenReader', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="dataRetention">Data Retention</Label>
                <Select value={settings.dataRetention} onValueChange={value => handleSettingChange('dataRetention', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSave">Auto Save</Label>
                  <p className="text-sm text-gray-500">Automatically save your progress</p>
                </div>
                <Switch
                  id="autoSave"
                  checked={settings.autoSave}
                  onCheckedChange={value => handleSettingChange('autoSave', value)}
                />
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={handleExportData} className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                </Button>
                <Button variant="outline" onClick={handleDeleteAccount} className="flex items-center space-x-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

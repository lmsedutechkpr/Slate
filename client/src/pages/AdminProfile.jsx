import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildApiUrl } from '../lib/utils.js';

const AdminProfile = () => {
  const { accessToken } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/users/profile'],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/users/profile'), { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },
    enabled: !!accessToken
  });

  const user = data?.user || {};
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  // hydrate fields when data loads
  if (!isLoading && firstName === '' && lastName === '' && phone === '' && user?.profile && username === '') {
    setFirstName(user.profile.firstName || '');
    setLastName(user.profile.lastName || '');
    setNickname(user.profile.nickname || '');
    setUsername(user.username || '');
    setPhone(user.profile.phone || '');
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildApiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, nickname, username })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => refetch()
  });

  const [avatarUploading, setAvatarUploading] = useState(false);
  const uploadAvatar = async (file) => {
    if (!file) return;
    setAvatarUploading(true);
    const form = new FormData();
    form.append('avatar', file);
    try {
      const res = await fetch(buildApiUrl('/api/users/avatar'), { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form });
      if (!res.ok) throw new Error('Failed to upload avatar');
      await res.json();
      await refetch();
    } finally { setAvatarUploading(false); }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildApiUrl('/api/users/password'), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      return res.json();
    },
    onSuccess: () => { setCurrentPassword(''); setNewPassword(''); }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600">Update your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
          <CardDescription>Change your name and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img src={user?.profile?.avatar || 'https://via.placeholder.com/64'} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            <div>
              <input type="file" accept="image/*" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
              {avatarUploading && <div className="text-xs text-gray-500 mt-1">Uploading...</div>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <Label>Nickname</Label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFirstName(user?.profile?.firstName || ''); setLastName(user?.profile?.lastName || ''); setNickname(user?.profile?.nickname || ''); setUsername(user?.username || ''); setPhone(user?.profile?.phone || ''); }}>Reset</Button>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Use a strong password you don’t use elsewhere</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Current password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending}>{changePassword.isPending ? 'Updating...' : 'Update Password'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;

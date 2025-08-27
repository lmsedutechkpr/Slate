import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx'

export default function Profile() {
  const { accessToken, user, updateUserProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    yearOfStudy: '',
    degree: '',
    interestType: '',
    careerGoal: '',
    learningPace: '',
    domains: [],
    phone: '',
    email: user?.email || '',
  })
  const [emailState, setEmailState] = useState({ newEmail: '', code: '', step: 'enter' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const res = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          cache: 'no-store'
        })
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json()
        if (!isMounted) return
        setProfile({
          firstName: data.user?.profile?.firstName || '',
          lastName: data.user?.profile?.lastName || '',
          yearOfStudy: data.user?.studentProfile?.yearOfStudy || '',
          degree: data.user?.studentProfile?.degree || '',
          interestType: data.user?.studentProfile?.interestType || '',
          careerGoal: data.user?.studentProfile?.careerGoal || '',
          learningPace: data.user?.studentProfile?.learningPace || '',
          domains: data.user?.studentProfile?.domains || [],
          phone: data.user?.profile?.phone || '',
          email: data.user?.email || '',
          avatar: data.user?.profile?.avatar || '',
        })
      } catch (e) {
        setError('Failed to load profile')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    if (accessToken) load()
    return () => { isMounted = false }
  }, [accessToken])

  async function onSave(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    const payload = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      yearOfStudy: profile.yearOfStudy,
      degree: profile.degree,
      interestType: profile.interestType,
      careerGoal: profile.careerGoal,
      domains: profile.domains,
      learningPace: profile.learningPace,
    }
    const res = await updateUserProfile(payload)
    if (res.success) setSuccess('Profile updated')
    else setError(res.message || 'Update failed')
  }

  async function onUploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setSuccess(''); setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to upload avatar')
      setProfile(p => ({ ...p, avatar: data.avatar }))
      setSuccess('Profile photo updated')
    } catch (e) {
      setError(e.message)
    } finally {
      setAvatarUploading(false)
    }
  }

  async function requestEmailCode() {
    setError(''); setSuccess('')
    try {
      const res = await fetch('/api/users/email/change-request', {
        method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: emailState.newEmail })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed request')
      setEmailState(s => ({ ...s, step: 'verify' }))
      setSuccess('Verification code sent (check console in dev)')
      console.log('devCode:', data.devCode)
    } catch (e) { setError(e.message) }
  }

  async function verifyEmailCode() {
    setError(''); setSuccess('')
    try {
      const res = await fetch('/api/users/email/verify', {
        method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailState.code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed verify')
      setProfile(p => ({ ...p, email: data.email }))
      setEmailState({ newEmail: '', code: '', step: 'enter' })
      setSuccess('Email updated')
    } catch (e) { setError(e.message) }
  }

  async function onChangePassword(e) {
    e.preventDefault(); setError(''); setSuccess('')
    if (pwd.newPassword !== pwd.confirm) { setError('New passwords do not match'); return }
    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update password')
      setPwd({ currentPassword: '', newPassword: '', confirm: '' })
      setSuccess('Password updated')
    } catch (e) { setError(e.message) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">No photo</span>
              )}
            </div>
            <div>
              <CardTitle>Student Profile</CardTitle>
              <div className="mt-2">
                <label className="text-sm font-medium text-primary cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={onUploadAvatar} />
                  {avatarUploading ? 'Uploading...' : 'Change photo'}
                </label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-600 mb-3">{error}</p>}
          {success && <p className="text-green-600 mb-3">{success}</p>}
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-fit">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={profile.firstName} onChange={e => setProfile(p => ({...p, firstName: e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={profile.lastName} onChange={e => setProfile(p => ({...p, lastName: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} readOnly />
                </div>
              </div>
              <Button type="button" onClick={onSave}>Save changes</Button>
            </TabsContent>

            <TabsContent value="academic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearOfStudy">Year of Study</Label>
                  <Input id="yearOfStudy" value={profile.yearOfStudy} onChange={e => setProfile(p => ({...p, yearOfStudy: e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="degree">Degree</Label>
                  <Input id="degree" value={profile.degree} onChange={e => setProfile(p => ({...p, degree: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestType">Interest Type</Label>
                  <Input id="interestType" value={profile.interestType} onChange={e => setProfile(p => ({...p, interestType: e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="learningPace">Learning Pace</Label>
                  <Input id="learningPace" value={profile.learningPace} onChange={e => setProfile(p => ({...p, learningPace: e.target.value}))} />
                </div>
              </div>
              <div>
                <Label htmlFor="domains">Domains (comma separated)</Label>
                <Input id="domains" value={profile.domains.join(', ')} onChange={e => setProfile(p => ({...p, domains: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))} />
              </div>
              <div>
                <Label htmlFor="careerGoal">Career Goal</Label>
                <Input id="careerGoal" value={profile.careerGoal} onChange={e => setProfile(p => ({...p, careerGoal: e.target.value}))} />
              </div>
              <Button type="button" onClick={onSave}>Save changes</Button>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <form onSubmit={onChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="curr">Current password</Label>
                  <Input id="curr" type="password" value={pwd.currentPassword} onChange={e => setPwd(p => ({...p, currentPassword: e.target.value}))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" value={pwd.newPassword} onChange={e => setPwd(p => ({...p, newPassword: e.target.value}))} />
                  </div>
                  <div>
                    <Label htmlFor="conf">Confirm new password</Label>
                    <Input id="conf" type="password" value={pwd.confirm} onChange={e => setPwd(p => ({...p, confirm: e.target.value}))} />
                  </div>
                </div>
                <Button type="submit">Change password</Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              {emailState.step === 'enter' ? (
                <div className="space-y-3">
                  <Label htmlFor="newEmail">New email</Label>
                  <Input id="newEmail" value={emailState.newEmail} onChange={e => setEmailState(s => ({...s, newEmail: e.target.value}))} />
                  <Button type="button" onClick={requestEmailCode}>Send verification code</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="code">Verification code</Label>
                  <Input id="code" value={emailState.code} onChange={e => setEmailState(s => ({...s, code: e.target.value}))} />
                  <Button type="button" onClick={verifyEmailCode}>Verify & update email</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}



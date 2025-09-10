import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/Common/LoadingSpinner.jsx';
import { getImageUrl, buildApiUrl } from '@/lib/utils.js';
import { 
  User, 
  GraduationCap, 
  Shield, 
  Mail, 
  Camera, 
  Save, 
  Eye, 
  EyeOff,
  Calendar,
  Phone,
  Award,
  Heart,
  Zap,
  BookOpen,
  Clock,
  Globe,
  MapPin,
  Briefcase,
  Target
} from 'lucide-react';

export default function Profile() {
  const { accessToken, user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profile, setProfile] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    email: user?.email || '',
    avatar: '',
    
    // Academic Information
    yearOfStudy: '',
    degree: '',
    university: '',
    major: '',
    gpa: '',
    expectedGraduation: '',
    
    // Learning Preferences
    interestType: '',
    domains: [],
    careerGoal: '',
    learningPace: '',
    preferredLanguage: 'english',
    studyGoals: [],
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Additional Information
    bio: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    skills: [],
    
    // Preferences
    notificationPreferences: {
      email: true,
      push: true,
      sms: false,
      courseUpdates: true,
      assignmentReminders: true,
      achievementAlerts: true,
      liveSessionReminders: true
    }
  });

  const [pwd, setPwd] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirm: '' 
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch(buildApiUrl('/api/users/profile'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        if (!isMounted) return;
        
        setProfile({
          firstName: data.user?.profile?.firstName || '',
          lastName: data.user?.profile?.lastName || '',
          phone: data.user?.profile?.phone || '',
          dateOfBirth: data.user?.profile?.dateOfBirth || '',
          gender: data.user?.profile?.gender || '',
          email: data.user?.email || '',
          avatar: data.user?.profile?.avatar || '',
          yearOfStudy: data.user?.studentProfile?.yearOfStudy || '',
          degree: data.user?.studentProfile?.degree || '',
          university: data.user?.studentProfile?.university || '',
          major: data.user?.studentProfile?.major || '',
          gpa: data.user?.studentProfile?.gpa || '',
          expectedGraduation: data.user?.studentProfile?.expectedGraduation || '',
          interestType: data.user?.studentProfile?.interestType || '',
          domains: data.user?.studentProfile?.domains || [],
          careerGoal: data.user?.studentProfile?.careerGoal || '',
          learningPace: data.user?.studentProfile?.learningPace || '',
          preferredLanguage: data.user?.studentProfile?.preferredLanguage || 'english',
          studyGoals: data.user?.studentProfile?.studyGoals || [],
          timeZone: data.user?.studentProfile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          bio: data.user?.studentProfile?.bio || '',
          linkedinUrl: data.user?.studentProfile?.linkedinUrl || '',
          githubUrl: data.user?.studentProfile?.githubUrl || '',
          portfolioUrl: data.user?.studentProfile?.portfolioUrl || '',
          skills: data.user?.studentProfile?.skills || [],
          notificationPreferences: data.user?.studentProfile?.notificationPreferences || {
            email: true,
            push: true,
            sms: false,
            courseUpdates: true,
            assignmentReminders: true,
            achievementAlerts: true,
            liveSessionReminders: true
          }
        });
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (accessToken) load();
    return () => { isMounted = false };
  }, [accessToken]);

  async function onSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const result = await updateUserProfile(profile);
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        // Dispatch event to update navbar
        window.dispatchEvent(new Event('profile-updated'));
      } else {
        setError(result.message || 'Update failed');
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  }

  async function onUploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setAvatarUploading(true);
    
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch(buildApiUrl('/api/users/avatar'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload avatar');
      setProfile(p => ({ ...p, avatar: data.avatar }));
      setSuccess('Profile photo updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Dispatch event to update navbar
      window.dispatchEvent(new Event('profile-updated'));
    } catch (e) {
      setError(e.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onChangePassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (pwd.newPassword !== pwd.confirm) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      const res = await fetch(buildApiUrl('/api/users/password'), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      setSuccess('Password updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    }
  }

  const handleDomainChange = (domain, checked) => {
    setProfile(prev => ({
      ...prev,
      domains: checked 
        ? [...prev.domains, domain]
        : prev.domains.filter(d => d !== domain)
    }));
  };

  const handleSkillChange = (skill, checked) => {
    setProfile(prev => ({
      ...prev,
      skills: checked 
        ? [...prev.skills, skill]
        : prev.skills.filter(s => s !== skill)
    }));
  };

  const handleNotificationChange = (key, value) => {
    setProfile(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4">
              {profile.avatar ? (
                        <img 
                          src={getImageUrl(profile.avatar, buildApiUrl(''))} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
              )}
            </div>
                    <label className="absolute bottom-2 right-2 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                      <Camera className="w-5 h-5 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={onUploadAvatar} 
                      />
                </label>
              </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Student</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
            </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Profile Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <Tabs defaultValue="personal" className="space-y-6">
                  <TabsList className="grid grid-cols-4 w-fit bg-gray-100">
                    <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:text-primary-700">
                      <User className="w-4 h-4 mr-2" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger value="academic" className="data-[state=active]:bg-white data-[state=active]:text-primary-700">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Academic
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="data-[state=active]:bg-white data-[state=active]:text-primary-700">
                      <Target className="w-4 h-4 mr-2" />
                      Preferences
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-primary-700">
                      <Shield className="w-4 h-4 mr-2" />
                      Security
                    </TabsTrigger>
            </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input 
                          id="firstName" 
                          value={profile.firstName} 
                          onChange={e => setProfile(p => ({...p, firstName: e.target.value}))}
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input 
                          id="lastName" 
                          value={profile.lastName} 
                          onChange={e => setProfile(p => ({...p, lastName: e.target.value}))}
                          placeholder="Enter your last name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="phone" 
                            value={profile.phone} 
                            onChange={e => setProfile(p => ({...p, phone: e.target.value}))}
                            placeholder="Enter your phone number"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="dateOfBirth" 
                            type="date" 
                            value={profile.dateOfBirth} 
                            onChange={e => setProfile(p => ({...p, dateOfBirth: e.target.value}))}
                            className="pl-10"
                          />
                        </div>
                      </div>
                <div>
                        <Label>Gender</Label>
                        <RadioGroup 
                          value={profile.gender} 
                          onValueChange={value => setProfile(p => ({...p, gender: value}))}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">Male</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">Female</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other">Other</Label>
                          </div>
                        </RadioGroup>
                </div>
                <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="email" 
                            value={profile.email} 
                            readOnly 
                            className="pl-10 bg-gray-50"
                          />
                        </div>
                </div>
              </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={profile.bio} 
                        onChange={e => setProfile(p => ({...p, bio: e.target.value}))}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                        <Input 
                          id="linkedinUrl" 
                          value={profile.linkedinUrl} 
                          onChange={e => setProfile(p => ({...p, linkedinUrl: e.target.value}))}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                <div>
                        <Label htmlFor="githubUrl">GitHub URL</Label>
                        <Input 
                          id="githubUrl" 
                          value={profile.githubUrl} 
                          onChange={e => setProfile(p => ({...p, githubUrl: e.target.value}))}
                          placeholder="https://github.com/..."
                        />
                </div>
                <div>
                        <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                        <Input 
                          id="portfolioUrl" 
                          value={profile.portfolioUrl} 
                          onChange={e => setProfile(p => ({...p, portfolioUrl: e.target.value}))}
                          placeholder="https://your-portfolio.com"
                        />
                </div>
              </div>
            </TabsContent>

                  {/* Academic Information Tab */}
                  <TabsContent value="academic" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="university">University/Institution *</Label>
                        <Input 
                          id="university" 
                          value={profile.university} 
                          onChange={e => setProfile(p => ({...p, university: e.target.value}))}
                          placeholder="Enter your university name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="degree">Degree Program *</Label>
                        <Input 
                          id="degree" 
                          value={profile.degree} 
                          onChange={e => setProfile(p => ({...p, degree: e.target.value}))}
                          placeholder="e.g., Bachelor of Science"
                        />
                      </div>
                      <div>
                        <Label htmlFor="major">Major/Field of Study</Label>
                        <Input 
                          id="major" 
                          value={profile.major} 
                          onChange={e => setProfile(p => ({...p, major: e.target.value}))}
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div>
                        <Label htmlFor="yearOfStudy">Year of Study *</Label>
                        <Select value={profile.yearOfStudy} onValueChange={value => setProfile(p => ({...p, yearOfStudy: value}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                            <SelectItem value="3">3rd Year</SelectItem>
                            <SelectItem value="4">4th Year</SelectItem>
                            <SelectItem value="5">5th Year</SelectItem>
                            <SelectItem value="graduate">Graduate Student</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                <div>
                        <Label htmlFor="gpa">GPA</Label>
                        <Input 
                          id="gpa" 
                          value={profile.gpa} 
                          onChange={e => setProfile(p => ({...p, gpa: e.target.value}))}
                          placeholder="e.g., 3.8"
                        />
                </div>
                <div>
                        <Label htmlFor="expectedGraduation">Expected Graduation</Label>
                        <Input 
                          id="expectedGraduation" 
                          type="date" 
                          value={profile.expectedGraduation} 
                          onChange={e => setProfile(p => ({...p, expectedGraduation: e.target.value}))}
                        />
                </div>
              </div>

                    <div>
                      <Label htmlFor="careerGoal">Career Goal</Label>
                      <Textarea 
                        id="careerGoal" 
                        value={profile.careerGoal} 
                        onChange={e => setProfile(p => ({...p, careerGoal: e.target.value}))}
                        placeholder="What are your career aspirations?"
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* Learning Preferences Tab */}
                  <TabsContent value="preferences" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="interestType">Interest Type *</Label>
                        <Select value={profile.interestType} onValueChange={value => setProfile(p => ({...p, interestType: value}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interest type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Core Engineering">Core Engineering</SelectItem>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Data Science">Data Science</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="learningPace">Learning Pace *</Label>
                        <Select value={profile.learningPace} onValueChange={value => setProfile(p => ({...p, learningPace: value}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select learning pace" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Slow">Slow</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Fast">Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                <div>
                        <Label htmlFor="preferredLanguage">Preferred Language</Label>
                        <Select value={profile.preferredLanguage} onValueChange={value => setProfile(p => ({...p, preferredLanguage: value}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="spanish">Spanish</SelectItem>
                            <SelectItem value="french">French</SelectItem>
                            <SelectItem value="german">German</SelectItem>
                            <SelectItem value="chinese">Chinese</SelectItem>
                            <SelectItem value="hindi">Hindi</SelectItem>
                          </SelectContent>
                        </Select>
                </div>
                <div>
                        <Label htmlFor="timeZone">Time Zone</Label>
                        <Select value={profile.timeZone} onValueChange={value => setProfile(p => ({...p, timeZone: value}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time zone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                            <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                            <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                            <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                            <SelectItem value="UTC+0">UTC</SelectItem>
                            <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                            <SelectItem value="UTC+5:30">India Standard Time (UTC+5:30)</SelectItem>
                            <SelectItem value="UTC+8">China Standard Time (UTC+8)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Areas of Interest (Domains) *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cybersecurity', 'Cloud Computing', 'DevOps', 'UI/UX Design', 'Game Development', 'Blockchain', 'IoT', 'AI/ML'].map(domain => (
                          <div key={domain} className="flex items-center space-x-2">
                            <Checkbox 
                              id={domain}
                              checked={profile.domains.includes(domain)}
                              onCheckedChange={(checked) => handleDomainChange(domain, checked)}
                            />
                            <Label htmlFor={domain} className="text-sm">{domain}</Label>
                          </div>
                        ))}
                </div>
              </div>

              <div>
                      <Label>Skills</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'Machine Learning'].map(skill => (
                          <div key={skill} className="flex items-center space-x-2">
                            <Checkbox 
                              id={skill}
                              checked={profile.skills.includes(skill)}
                              onCheckedChange={(checked) => handleSkillChange(skill, checked)}
                            />
                            <Label htmlFor={skill} className="text-sm">{skill}</Label>
                          </div>
                        ))}
                      </div>
              </div>

              <div>
                      <Label>Notification Preferences</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <Label htmlFor="emailNotif">Email Notifications</Label>
                          </div>
                          <Checkbox 
                            id="emailNotif"
                            checked={profile.notificationPreferences.email}
                            onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-gray-500" />
                            <Label htmlFor="pushNotif">Push Notifications</Label>
                          </div>
                          <Checkbox 
                            id="pushNotif"
                            checked={profile.notificationPreferences.push}
                            onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <Label htmlFor="courseUpdates">Course Updates</Label>
                          </div>
                          <Checkbox 
                            id="courseUpdates"
                            checked={profile.notificationPreferences.courseUpdates}
                            onCheckedChange={(checked) => handleNotificationChange('courseUpdates', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <Label htmlFor="assignmentReminders">Assignment Reminders</Label>
                          </div>
                          <Checkbox 
                            id="assignmentReminders"
                            checked={profile.notificationPreferences.assignmentReminders}
                            onCheckedChange={(checked) => handleNotificationChange('assignmentReminders', checked)}
                          />
                        </div>
                      </div>
              </div>
            </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Change Password</h4>
              <form onSubmit={onChangePassword} className="space-y-4">
                <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input 
                              id="currentPassword" 
                              type={showPassword ? "text" : "password"}
                              value={pwd.currentPassword} 
                              onChange={e => setPwd(p => ({...p, currentPassword: e.target.value}))}
                              placeholder="Enter current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Input 
                                id="newPassword" 
                                type={showNewPassword ? "text" : "password"}
                                value={pwd.newPassword} 
                                onChange={e => setPwd(p => ({...p, newPassword: e.target.value}))}
                                placeholder="Enter new password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                  </div>
                  <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                              <Input 
                                id="confirmPassword" 
                                type={showConfirmPassword ? "text" : "password"}
                                value={pwd.confirm} 
                                onChange={e => setPwd(p => ({...p, confirm: e.target.value}))}
                                placeholder="Confirm new password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                  </div>
                </div>
                        <Button type="submit">Change Password</Button>
              </form>
                </div>
            </TabsContent>
          </Tabs>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <Button onClick={onSave} className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </Button>
                </div>
        </CardContent>
      </Card>
    </div>
        </div>
      </div>
    </div>
  );
}



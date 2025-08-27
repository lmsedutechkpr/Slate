import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
import { InterestTypes, LearningPace, Domains } from "../constants.js";

const OnboardingStep = ({ step, title, children }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">Step {step} of 3</p>
    </div>
    {children}
  </div>
);

const Onboarding = () => {
  const [, setLocation] = useLocation();
  const { updateUserProfile, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    yearOfStudy: '',
    degree: '',
    interestType: '',
    domains: [],
    careerGoal: '',
    learningPace: ''
  });

  const progress = (currentStep / 3) * 100;

  // If already onboarded, never show this page again
  useEffect(() => {
    const onboardedFlag = localStorage.getItem('onboarded') === 'true';
    const onboardedProfile = Boolean(user && user.studentProfile && user.studentProfile.onboarded);
    if (onboardedFlag || onboardedProfile) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // Prefill from existing profile if available
  useEffect(() => {
    if (!user) return;
    setFormData(prev => ({
      firstName: prev.firstName || user.profile?.firstName || '',
      lastName: prev.lastName || user.profile?.lastName || '',
      phone: prev.phone || user.profile?.phone || '',
      yearOfStudy: prev.yearOfStudy || user.studentProfile?.yearOfStudy || '',
      degree: prev.degree || user.studentProfile?.degree || '',
      interestType: prev.interestType || user.studentProfile?.interestType || '',
      domains: prev.domains && prev.domains.length ? prev.domains : (user.studentProfile?.domains || []),
      careerGoal: prev.careerGoal || user.studentProfile?.careerGoal || '',
      learningPace: prev.learningPace || user.studentProfile?.learningPace || ''
    }));
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDomainChange = (domain, checked) => {
    setFormData(prev => ({
      ...prev,
      domains: checked 
        ? [...prev.domains, domain]
        : prev.domains.filter(d => d !== domain)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.yearOfStudy && formData.degree;
      case 2:
        return formData.interestType && formData.domains.length > 0;
      case 3:
        return formData.learningPace;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setError('');
    } else {
      setError('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateUserProfile(formData);
      
      if (result.success) {
        try { localStorage.setItem('onboarded', 'true'); } catch {}
        setLocation('/dashboard');
      } else {
        setError(result.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      // Mark onboarded without collecting details
      const result = await updateUserProfile({});
      if (result.success) {
        try { localStorage.setItem('onboarded', 'true'); } catch {}
        setLocation('/dashboard');
      } else {
        setLocation('/dashboard');
      }
    } catch {
      setLocation('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Help us personalize your learning experience
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    step <= currentStep 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div 
                    className={`w-16 h-1 ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" data-testid="onboarding-progress" />
        </div>

        {/* Onboarding Form */}
        <Card>
          <CardHeader>
            <CardTitle>Let's get to know you better</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6" data-testid="error-alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Personal + Academic Information */}
            {currentStep === 1 && (
              <OnboardingStep step={1} title="Your Details">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="e.g., John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="e.g., Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="e.g., +1 555 123 4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearOfStudy">Year of Study *</Label>
                    <Select 
                      value={formData.yearOfStudy} 
                      onValueChange={(value) => handleInputChange('yearOfStudy', value)}
                    >
                      <SelectTrigger data-testid="select-yearOfStudy">
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="degree">Degree Program *</Label>
                    <Input
                      id="degree"
                      value={formData.degree}
                      onChange={(e) => handleInputChange('degree', e.target.value)}
                      placeholder="e.g., Computer Science Engineering"
                      data-testid="input-degree"
                    />
                  </div>
                </div>
              </OnboardingStep>
            )}

            {/* Step 2: Interests and Domains */}
            {currentStep === 2 && (
              <OnboardingStep step={2} title="Learning Interests">
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Interest Type *</Label>
                    <RadioGroup 
                      value={formData.interestType} 
                      onValueChange={(value) => handleInputChange('interestType', value)}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={InterestTypes.CORE} id="core" />
                        <Label htmlFor="core">Core Engineering</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={InterestTypes.IT} id="it" />
                        <Label htmlFor="it">Information Technology</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Domains of Interest * (Select at least one)</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {Domains.map((domain) => (
                        <div key={domain} className="flex items-center space-x-2">
                          <Checkbox
                            id={domain}
                            checked={formData.domains.includes(domain)}
                            onCheckedChange={(checked) => handleDomainChange(domain, checked)}
                            data-testid={`checkbox-${domain}`}
                          />
                          <Label htmlFor={domain} className="text-sm capitalize">
                            {domain.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </OnboardingStep>
            )}

            {/* Step 3: Learning Preferences */}
            {currentStep === 3 && (
              <OnboardingStep step={3} title="Learning Preferences">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="careerGoal">Career Goal (Optional)</Label>
                    <Input
                      id="careerGoal"
                      value={formData.careerGoal}
                      onChange={(e) => handleInputChange('careerGoal', e.target.value)}
                      placeholder="e.g., Full Stack Developer, Data Scientist"
                      data-testid="input-careerGoal"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Learning Pace *</Label>
                    <RadioGroup 
                      value={formData.learningPace} 
                      onValueChange={(value) => handleInputChange('learningPace', value)}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={LearningPace.SLOW} id="slow" />
                        <Label htmlFor="slow">Slow (1-2 hours/week)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={LearningPace.MEDIUM} id="medium" />
                        <Label htmlFor="medium">Medium (3-5 hours/week)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={LearningPace.INTENSIVE} id="intensive" />
                        <Label htmlFor="intensive">Intensive (6+ hours/week)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </OnboardingStep>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep === 1 ? (
                <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  data-testid="button-skip"
                >
                  Skip for Now
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  data-testid="button-previous"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStep === 3 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="button-complete"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </div>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={nextStep}
                  data-testid="button-next"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;

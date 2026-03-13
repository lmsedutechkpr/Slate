import fs from 'fs';

const authEn = {
  "windowTitle": "Slate — {action}",
  "backToHome": "← Back to Slate",
  "or": "or",
  "login": {
    "title": "Welcome back",
    "subtitle": "Sign in to your account",
    "email": "Email",
    "emailPlaceholder": "you@example.com",
    "password": "Password",
    "passwordPlaceholder": "••••••••",
    "rememberMe": "Remember me",
    "forgotPassword": "Forgot password?",
    "submit": "Sign In",
    "google": "Continue with Google",
    "noAccount": "Don't have an account? ",
    "signUpLink": "Sign up",
    "errors": {
      "invalidCredentials": "Incorrect email or password",
      "emailNotConfirmed": "Please verify your email first",
      "suspended": "Your account has been suspended. Contact support.",
      "default": "Something went wrong. Try again."
    }
  },
  "signup": {
    "role": {
      "title": "Join Slate",
      "subtitle": "Choose how you want to use the platform",
      "student": "Student",
      "studentTagline": "I want to learn",
      "studentPoints": ["Free to join", "Access 100s of courses", "Shop learning gear"],
      "instructor": "Instructor",
      "instructorTagline": "I want to teach",
      "instructorPoints": ["Keep 70% of revenue", "Host live classes", "Requires approval"],
      "seller": "Seller",
      "sellerTagline": "I want to sell",
      "sellerPoints": ["Keep 85% of sales", "Reach active learners", "Requires approval"],
      "requiresApproval": "Requires admin approval",
      "continue": "Continue as {role} →",
      "hasAccount": "Already have an account? Sign in"
    },
    "student": {
      "changeRole": "← Change role",
      "title": "Create your account",
      "subtitle": "Start learning in minutes",
      "fullName": "Full Name",
      "fullNamePlaceholder": "Your full name",
      "confirmPassword": "Confirm Password",
      "language": "Language Preference",
      "terms": "I agree to the Terms of Service and Privacy Policy",
      "submit": "Create Account"
    },
    "instructor": {
      "stepN": "Step {step} of 3",
      "personal": "Personal Info",
      "professional": "Professional Info",
      "review": "Review & Submit",
      "phone": "Phone (optional)",
      "country": "Country",
      "headline": "Headline",
      "headlinePlaceholder": "Senior UX Designer at Google",
      "bio": "Bio",
      "bioPlaceholder": "Tell students about yourself...",
      "expertise": "Expertise Tags",
      "teachingLangs": "Teaching Languages",
      "english": "English",
      "tamil": "Tamil",
      "both": "Both",
      "linkedin": "LinkedIn URL (optional)",
      "portfolio": "Portfolio URL (optional)",
      "website": "Website URL (optional)",
      "edit": "Edit",
      "declaration": "I confirm this information is accurate and I agree to the Instructor Terms.",
      "submit": "Submit Application"
    },
    "seller": {
      "store": "Store Info",
      "storeName": "Store Name",
      "storeNamePlaceholder": "My Tech Store",
      "storeDesc": "Store Description",
      "businessType": "Business Type",
      "individual": "Individual",
      "individualDesc": "Personal seller",
      "company": "Company",
      "companyDesc": "Registered business",
      "gst": "GST Number (optional)",
      "gstPlaceholder": "22AAAAA0000A1Z5",
      "gstHelp": "Leave blank if not applicable",
      "declaration": "I agree to the Seller Terms and understand Slate's commission structure."
    }
  },
  "forgotPassword": {
    "title": "Forgot your password?",
    "subtitle": "Enter your email and we'll send a reset link.",
    "submit": "Send Reset Link",
    "remembered": "Remember it? Sign in",
    "sentTitle": "Check your email",
    "sentSubtitle": "We sent a reset link to {email}",
    "resend": "Resend email",
    "resendWait": "Resend in {seconds}s",
    "backLogin": "Back to sign in"
  },
  "resetPassword": {
    "forcedTitle": "Set your new password",
    "forcedSubtitle": "You must change your temporary password to continue.",
    "title": "Choose a new password",
    "subtitle": "Make it strong and don't reuse old ones.",
    "newPassword": "New Password",
    "confirmPassword": "Confirm New Password",
    "submit": "Update Password"
  },
  "verifyEmail": {
    "title": "Check your inbox",
    "subtitle": "We sent a verification link to:",
    "instructions": "Click the link in the email to activate your account. Check your spam folder if you don't see it.",
    "resend": "Resend verification email",
    "resentSuccess": "Email resent!",
    "wrongEmail": "Wrong email? Go back"
  },
  "pending": {
    "receivedTitle": "Application received",
    "receivedSubtitle": "Your {role} application is under review.",
    "info": "We review applications within 2-3 business days. You'll receive an email once a decision is made.",
    "submittedAt": "Submitted {time}",
    "waiting": "Waiting for admin review",
    "approvedTitle": "You're approved! 🎉",
    "approvedSubtitle": "Your {role} account is now active.",
    "goDashboard": "Go to Dashboard",
    "rejectedTitle": "Application not approved",
    "reason": "Reason: {reason}",
    "applyAgain": "Apply again",
    "contactSupport": "Contact support"
  }
};

const enPath = 'e:/End_Sem_Project/slate_lms/messages/en.json';
const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
enContent.auth = authEn;
fs.writeFileSync(enPath, JSON.stringify(enContent, null, 2));

const taPath = 'e:/End_Sem_Project/slate_lms/messages/ta.json';
const taContent = JSON.parse(fs.readFileSync(taPath, 'utf8'));
taContent.auth = authEn; // English fallback for now
fs.writeFileSync(taPath, JSON.stringify(taContent, null, 2));

console.log('Translations updated.');

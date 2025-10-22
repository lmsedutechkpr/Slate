import bcrypt from 'bcrypt';
import { 
  User, Course, Enrollment, Assignment, LiveSession, Product, Review, AuditLog, 
  Role, Order, Payment, ProductBundle, TransactionLog, UserActivity, AdminSettings 
} from '../models/index.js';
import { UserRoles } from '../constants.js';

// Comprehensive seed data covering ALL functionality

// Enhanced instructors with more detailed profiles
const instructors = [
  {
    username: 'john_doe',
    email: 'john.doe@example.com',
    password: 'Instructor123!',
    role: UserRoles.INSTRUCTOR,
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0101',
      dateOfBirth: '1985-03-15',
      gender: 'male'
    },
    instructorProfile: {
      bio: 'Full-stack developer with 10+ years of experience in web development. Passionate about teaching modern technologies and helping students build real-world applications.',
      expertise: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'MongoDB', 'Express'],
      experience: '10+ years',
      education: 'MS Computer Science, Stanford University',
      certifications: ['AWS Certified Developer', 'Google Cloud Professional', 'MongoDB Certified Developer'],
      hourlyRate: 75,
      availability: 'Monday-Friday, 9 AM - 6 PM EST',
      languages: ['English', 'Spanish'],
      timezone: 'EST',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        twitter: 'https://twitter.com/johndoe'
      }
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'sarah_wilson',
    email: 'sarah.wilson@example.com',
    password: 'Instructor123!',
    role: UserRoles.INSTRUCTOR,
    profile: {
      firstName: 'Sarah',
      lastName: 'Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0102',
      dateOfBirth: '1988-07-22',
      gender: 'female'
    },
    instructorProfile: {
      bio: 'Data scientist and machine learning expert. Former Google engineer with expertise in AI and ML. Published researcher with 20+ papers in top-tier conferences.',
      expertise: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn'],
      experience: '8+ years',
      education: 'PhD Data Science, MIT',
      certifications: ['TensorFlow Developer Certificate', 'AWS Machine Learning Specialty', 'Google Data Analytics Certificate'],
      hourlyRate: 90,
      availability: 'Monday-Friday, 10 AM - 7 PM EST',
      languages: ['English', 'French'],
      timezone: 'EST',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/sarahwilson',
        github: 'https://github.com/sarahwilson',
        twitter: 'https://twitter.com/sarahwilson'
      }
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'mike_chen',
    email: 'mike.chen@example.com',
    password: 'Instructor123!',
    role: UserRoles.INSTRUCTOR,
    profile: {
      firstName: 'Mike',
      lastName: 'Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0103',
      dateOfBirth: '1982-11-08',
      gender: 'male'
    },
    instructorProfile: {
      bio: 'Mobile app developer specializing in iOS and Android. Created multiple successful apps with millions of downloads. Expert in cross-platform development.',
      expertise: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'iOS', 'Android', 'Xcode', 'Android Studio'],
      experience: '12+ years',
      education: 'BS Computer Engineering, UC Berkeley',
      certifications: ['Apple Certified iOS Developer', 'Google Android Developer', 'React Native Certified'],
      hourlyRate: 85,
      availability: 'Monday-Friday, 8 AM - 5 PM PST',
      languages: ['English', 'Mandarin'],
      timezone: 'PST',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/mikechen',
        github: 'https://github.com/mikechen',
        twitter: 'https://twitter.com/mikechen'
      }
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'emma_davis',
    email: 'emma.davis@example.com',
    password: 'Instructor123!',
    role: UserRoles.INSTRUCTOR,
    profile: {
      firstName: 'Emma',
      lastName: 'Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0104',
      dateOfBirth: '1990-05-12',
      gender: 'female'
    },
    instructorProfile: {
      bio: 'UI/UX designer and frontend developer. Expert in creating beautiful, user-friendly interfaces. Former design lead at multiple tech startups.',
      expertise: ['Figma', 'Adobe XD', 'React', 'Vue.js', 'CSS', 'Design Systems', 'Prototyping', 'User Research'],
      experience: '6+ years',
      education: 'BFA Graphic Design, Art Center College of Design',
      certifications: ['Google UX Design Certificate', 'Adobe Certified Expert', 'Figma Certified'],
      hourlyRate: 70,
      availability: 'Monday-Friday, 9 AM - 6 PM EST',
      languages: ['English', 'Italian'],
      timezone: 'EST',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/emmadavis',
        github: 'https://github.com/emmadavis',
        twitter: 'https://twitter.com/emmadavis'
      }
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'alex_rodriguez',
    email: 'alex.rodriguez@example.com',
    password: 'Instructor123!',
    role: UserRoles.INSTRUCTOR,
    profile: {
      firstName: 'Alex',
      lastName: 'Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0105',
      dateOfBirth: '1987-09-30',
      gender: 'male'
    },
    instructorProfile: {
      bio: 'DevOps engineer and cloud architect. Expert in AWS, Docker, Kubernetes, and CI/CD pipelines. Helped scale multiple startups to millions of users.',
      expertise: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux', 'CI/CD', 'Microservices'],
      experience: '9+ years',
      education: 'MS Software Engineering, Carnegie Mellon',
      certifications: ['AWS Solutions Architect', 'Certified Kubernetes Administrator', 'Docker Certified'],
      hourlyRate: 95,
      availability: 'Monday-Friday, 8 AM - 6 PM EST',
      languages: ['English', 'Spanish'],
      timezone: 'EST',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/alexrodriguez',
        github: 'https://github.com/alexrodriguez',
        twitter: 'https://twitter.com/alexrodriguez'
      }
    },
    status: 'active',
    completedOnboarding: true
  }
];

// Enhanced students with detailed profiles
const students = [
  {
    username: 'alice_johnson',
    email: 'alice.johnson@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'Alice',
      lastName: 'Johnson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0201',
      dateOfBirth: '1995-01-15',
      gender: 'female'
    },
    studentProfile: {
      interests: ['webdev', 'mobile'],
      domains: ['tech', 'business'],
      learningPace: 'moderate',
      goals: 'Career change to software development',
      experience: 'beginner',
      currentJob: 'Marketing Manager',
      education: 'BA Business Administration',
      location: 'New York, NY',
      timezone: 'EST'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'bob_smith',
    email: 'bob.smith@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'Bob',
      lastName: 'Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0202',
      dateOfBirth: '1992-06-20',
      gender: 'male'
    },
    studentProfile: {
      interests: ['data', 'ai'],
      domains: ['tech', 'science'],
      learningPace: 'fast',
      goals: 'Become a data scientist',
      experience: 'intermediate',
      currentJob: 'Data Analyst',
      education: 'BS Mathematics',
      location: 'San Francisco, CA',
      timezone: 'PST'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'carol_brown',
    email: 'carol.brown@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'Carol',
      lastName: 'Brown',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0203',
      dateOfBirth: '1998-03-10',
      gender: 'female'
    },
    studentProfile: {
      interests: ['design', 'webdev'],
      domains: ['creative', 'tech'],
      learningPace: 'moderate',
      goals: 'Learn UI/UX design',
      experience: 'beginner',
      currentJob: 'Graphic Designer',
      education: 'BFA Visual Arts',
      location: 'Chicago, IL',
      timezone: 'CST'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'david_lee',
    email: 'david.lee@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'David',
      lastName: 'Lee',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0204',
      dateOfBirth: '1993-12-05',
      gender: 'male'
    },
    studentProfile: {
      interests: ['mobile', 'webdev'],
      domains: ['tech'],
      learningPace: 'fast',
      goals: 'Build mobile apps',
      experience: 'intermediate',
      currentJob: 'Software Developer',
      education: 'BS Computer Science',
      location: 'Austin, TX',
      timezone: 'CST'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'eva_garcia',
    email: 'eva.garcia@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'Eva',
      lastName: 'Garcia',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0205',
      dateOfBirth: '1996-08-18',
      gender: 'female'
    },
    studentProfile: {
      interests: ['data', 'webdev'],
      domains: ['tech', 'business'],
      learningPace: 'moderate',
      goals: 'Learn data analysis',
      experience: 'beginner',
      currentJob: 'Business Analyst',
      education: 'MBA Business Administration',
      location: 'Miami, FL',
      timezone: 'EST'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'frank_miller',
    email: 'frank.miller@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'Frank',
      lastName: 'Miller',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0206',
      dateOfBirth: '1991-04-25',
      gender: 'male'
    },
    studentProfile: {
      interests: ['ai', 'data'],
      domains: ['tech', 'science'],
      learningPace: 'fast',
      goals: 'Machine learning expert',
      experience: 'advanced',
      currentJob: 'Research Scientist',
      education: 'PhD Physics',
      location: 'Boston, MA',
      timezone: 'EST'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'grace_taylor',
    email: 'grace.taylor@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'Grace',
      lastName: 'Taylor',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0207',
      dateOfBirth: '1994-11-12',
      gender: 'female'
    },
    studentProfile: {
      interests: ['design', 'mobile'],
      domains: ['creative', 'tech'],
      learningPace: 'moderate',
      goals: 'Mobile app designer',
      experience: 'intermediate',
      currentJob: 'UI Designer',
      education: 'BFA Digital Design',
      location: 'Seattle, WA',
      timezone: 'PST'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'henry_anderson',
    email: 'henry.anderson@example.com',
    password: 'Student123!',
    role: UserRoles.STUDENT,
    profile: {
      firstName: 'Henry',
      lastName: 'Anderson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      phone: '+1-555-0208',
      dateOfBirth: '1997-02-28',
      gender: 'male'
    },
    studentProfile: {
      interests: ['webdev', 'ai'],
      domains: ['tech'],
      learningPace: 'fast',
      goals: 'Full-stack developer',
      experience: 'beginner',
      currentJob: 'Student',
      education: 'BS Computer Science (In Progress)',
      location: 'Denver, CO',
      timezone: 'MST'
    },
    status: 'active',
    completedOnboarding: true
  }
];

// Comprehensive courses with detailed structure
const courses = [
  {
    title: 'Complete Web Development Bootcamp',
    description: 'Learn modern web development from scratch. Master HTML, CSS, JavaScript, React, Node.js, and more to build real-world applications. This comprehensive course covers everything from basic HTML to advanced React patterns.',
    category: 'Web Development',
    level: 'beginner',
    language: 'English',
    price: 199,
    tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
    coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'HTML Fundamentals',
          description: 'Learn the building blocks of web development',
          lectures: [
            {
              title: 'Introduction to HTML',
              description: 'Understanding HTML structure and basic elements',
              videoUrl: 'https://example.com/videos/html-intro.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 1800,
              resources: [
                { title: 'HTML Cheat Sheet', url: 'https://example.com/resources/html-cheatsheet.pdf', type: 'pdf' },
                { title: 'MDN HTML Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', type: 'link' },
                { title: 'HTML Practice Exercises', url: 'https://example.com/resources/html-exercises.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'HTML Forms and Input Elements',
              description: 'Creating interactive forms and handling user input',
              videoUrl: 'https://example.com/videos/html-forms.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2400,
              resources: [
                { title: 'Form Validation Guide', url: 'https://example.com/resources/form-validation.pdf', type: 'pdf' },
                { title: 'HTML5 Form Elements', url: 'https://example.com/resources/html5-forms.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            },
            {
              title: 'Semantic HTML and Accessibility',
              description: 'Writing accessible and semantic HTML code',
              videoUrl: 'https://example.com/videos/html-semantic.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2100,
              resources: [
                { title: 'Accessibility Guidelines', url: 'https://example.com/resources/accessibility.pdf', type: 'pdf' }
              ],
              order: 3,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'CSS Styling',
          description: 'Master CSS for beautiful and responsive designs',
          lectures: [
            {
              title: 'CSS Basics and Selectors',
              description: 'Understanding CSS syntax and selectors',
              videoUrl: 'https://example.com/videos/css-basics.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2100,
              resources: [
                { title: 'CSS Selectors Reference', url: 'https://example.com/resources/css-selectors.pdf', type: 'pdf' },
                { title: 'CSS Properties Guide', url: 'https://example.com/resources/css-properties.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Flexbox and Grid Layout',
              description: 'Modern CSS layout techniques',
              videoUrl: 'https://example.com/videos/css-layout.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2700,
              resources: [
                { title: 'Flexbox Froggy Game', url: 'https://flexboxfroggy.com/', type: 'link' },
                { title: 'CSS Grid Garden', url: 'https://cssgridgarden.com/', type: 'link' }
              ],
              order: 2,
              isPublished: true
            },
            {
              title: 'Responsive Design',
              description: 'Creating mobile-friendly websites',
              videoUrl: 'https://example.com/videos/css-responsive.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2400,
              resources: [
                { title: 'Responsive Design Patterns', url: 'https://example.com/resources/responsive-patterns.pdf', type: 'pdf' }
              ],
              order: 3,
              isPublished: true
            }
          ],
          order: 2,
          isPublished: true
        },
        {
          title: 'JavaScript Fundamentals',
          description: 'Learn JavaScript programming from basics to advanced',
          lectures: [
            {
              title: 'JavaScript Basics',
              description: 'Variables, functions, and control structures',
              videoUrl: 'https://example.com/videos/js-basics.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 3000,
              resources: [
                { title: 'JavaScript Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'DOM Manipulation',
              description: 'Interacting with HTML elements using JavaScript',
              videoUrl: 'https://example.com/videos/js-dom.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2700,
              resources: [
                { title: 'DOM Methods Guide', url: 'https://example.com/resources/dom-methods.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            }
          ],
          order: 3,
          isPublished: true
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0,
    difficulty: 'beginner',
    estimatedDuration: '40 hours',
    prerequisites: 'Basic computer skills',
    learningOutcomes: [
      'Build responsive websites',
      'Understand HTML structure',
      'Style with CSS',
      'Add interactivity with JavaScript',
      'Create modern web applications'
    ]
  },
  {
    title: 'React.js Complete Guide',
    description: 'Master React.js from fundamentals to advanced concepts. Build modern, scalable web applications with hooks, context, and best practices.',
    category: 'Frontend Development',
    level: 'intermediate',
    language: 'English',
    price: 149,
    tags: ['React', 'JavaScript', 'Hooks', 'Context', 'Redux', 'JSX'],
    coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'React Fundamentals',
          description: 'Understanding React core concepts',
          lectures: [
            {
              title: 'Introduction to React',
              description: 'What is React and why use it',
              videoUrl: 'https://example.com/videos/react-intro.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2400,
              resources: [
                { title: 'React Documentation', url: 'https://reactjs.org/docs/getting-started.html', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Components and JSX',
              description: 'Creating reusable components',
              videoUrl: 'https://example.com/videos/react-components.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 3000,
              resources: [
                { title: 'JSX Syntax Guide', url: 'https://example.com/resources/jsx-guide.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'React Hooks',
          description: 'Modern React with hooks',
          lectures: [
            {
              title: 'useState and useEffect',
              description: 'Managing state and side effects',
              videoUrl: 'https://example.com/videos/react-hooks.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2700,
              resources: [
                { title: 'Hooks Reference', url: 'https://example.com/resources/hooks-reference.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            }
          ],
          order: 2,
          isPublished: true
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0,
    difficulty: 'intermediate',
    estimatedDuration: '25 hours',
    prerequisites: 'Basic JavaScript knowledge',
    learningOutcomes: [
      'Build React applications',
      'Use React hooks effectively',
      'Manage component state',
      'Create reusable components',
      'Implement routing'
    ]
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python programming for data analysis, visualization, and machine learning. Perfect for beginners and intermediate learners.',
    category: 'Data Science',
    level: 'beginner',
    language: 'English',
    price: 179,
    tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Data Analysis', 'Jupyter'],
    coverUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'Python Basics',
          description: 'Fundamental Python programming',
          lectures: [
            {
              title: 'Python Fundamentals',
              description: 'Variables, data types, and control structures',
              videoUrl: 'https://example.com/videos/python-basics.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2700,
              resources: [
                { title: 'Python Documentation', url: 'https://docs.python.org/3/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Data Structures',
              description: 'Lists, dictionaries, and tuples',
              videoUrl: 'https://example.com/videos/python-data-structures.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 2400,
              resources: [
                { title: 'Data Structures Guide', url: 'https://example.com/resources/data-structures.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'Data Analysis with Pandas',
          description: 'Working with data using Pandas',
          lectures: [
            {
              title: 'Pandas Introduction',
              description: 'DataFrames and Series basics',
              videoUrl: 'https://example.com/videos/pandas-intro.mp4',
              youtubeId: 'dQw4w9WgXcQ',
              durationSec: 3000,
              resources: [
                { title: 'Pandas Documentation', url: 'https://pandas.pydata.org/docs/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            }
          ],
          order: 2,
          isPublished: true
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0,
    difficulty: 'beginner',
    estimatedDuration: '30 hours',
    prerequisites: 'Basic programming knowledge',
    learningOutcomes: [
      'Write Python programs',
      'Analyze data with Pandas',
      'Create data visualizations',
      'Work with Jupyter notebooks',
      'Apply statistical methods'
    ]
  }
];

// Enhanced products with detailed information
const products = [
  {
    name: 'Premium Course Bundle',
    description: 'Get access to all premium courses with lifetime updates and exclusive content. Perfect for serious learners who want comprehensive education.',
    price: 499,
    category: 'Bundle',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    stock: 1000,
    isActive: true,
    features: [
      'Access to all courses',
      'Lifetime updates',
      'Exclusive content',
      'Priority support',
      'Certificate of completion',
      'Mobile app access',
      'Offline downloads'
    ],
    tags: ['premium', 'bundle', 'lifetime'],
    sku: 'PCB-001',
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    }
  },
  {
    name: '1-on-1 Mentoring Session',
    description: 'Personalized 1-hour mentoring session with industry experts. Get personalized guidance and career advice.',
    price: 150,
    category: 'Service',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
    stock: 50,
    isActive: true,
    features: [
      '1-hour session',
      'Personalized guidance',
      'Career advice',
      'Code review',
      'Follow-up resources',
      'Flexible scheduling',
      'Expert instructors'
    ],
    tags: ['mentoring', 'personal', 'career'],
    sku: 'MNT-001',
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    }
  },
  {
    name: 'Project Portfolio Review',
    description: 'Get your projects reviewed by professionals and improve your portfolio. Essential for job applications.',
    price: 99,
    category: 'Service',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    stock: 100,
    isActive: true,
    features: [
      'Detailed feedback',
      'Improvement suggestions',
      'Best practices guide',
      'Portfolio optimization tips',
      'Industry insights',
      'Resume integration'
    ],
    tags: ['portfolio', 'review', 'career'],
    sku: 'PRV-001',
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    }
  }
];

export const seedComprehensiveData = async () => {
  try {
    console.log('🌱 Starting comprehensive data seeding...');

    // Hash passwords for all users
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 10);
    };

    // Create instructors
    console.log('👨‍🏫 Creating instructors...');
    const createdInstructors = [];
    for (const instructorData of instructors) {
      const existingInstructor = await User.findOne({ email: instructorData.email });
      if (!existingInstructor) {
        instructorData.password = await hashPassword(instructorData.password);
        const instructor = new User(instructorData);
        await instructor.save();
        createdInstructors.push(instructor);
        console.log(`✅ Created instructor: ${instructor.profile.firstName} ${instructor.profile.lastName}`);
      } else {
        createdInstructors.push(existingInstructor);
        console.log(`⏭️  Instructor already exists: ${existingInstructor.profile.firstName} ${existingInstructor.profile.lastName}`);
      }
    }

    // Create students
    console.log('👨‍🎓 Creating students...');
    const createdStudents = [];
    for (const studentData of students) {
      const existingStudent = await User.findOne({ email: studentData.email });
      if (!existingStudent) {
        studentData.password = await hashPassword(studentData.password);
        const student = new User(studentData);
        await student.save();
        createdStudents.push(student);
        console.log(`✅ Created student: ${student.profile.firstName} ${student.profile.lastName}`);
      } else {
        createdStudents.push(existingStudent);
        console.log(`⏭️  Student already exists: ${existingStudent.profile.firstName} ${existingStudent.profile.lastName}`);
      }
    }

    // Create courses
    console.log('📚 Creating courses...');
    const createdCourses = [];
    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];
      const instructor = createdInstructors[i % createdInstructors.length];
      
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (!existingCourse) {
        courseData.createdBy = instructor._id;
        courseData.assignedInstructor = instructor._id;
        const course = new Course(courseData);
        await course.save();
        createdCourses.push(course);
        console.log(`✅ Created course: ${course.title} (Instructor: ${instructor.profile.firstName})`);
      } else {
        createdCourses.push(existingCourse);
        console.log(`⏭️  Course already exists: ${existingCourse.title}`);
      }
    }

    // Create enrollments
    console.log('🎯 Creating enrollments...');
    for (const course of createdCourses) {
      const enrolledStudents = createdStudents.slice(0, Math.floor(Math.random() * 6) + 3); // 3-8 students per course
      
      for (const student of enrolledStudents) {
        const existingEnrollment = await Enrollment.findOne({ 
          studentId: student._id, 
          courseId: course._id 
        });
        
        if (!existingEnrollment) {
          const enrollment = new Enrollment({
            studentId: student._id,
            courseId: course._id,
            enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            progress: Math.floor(Math.random() * 80) + 10, // 10-90% progress
            completedLessons: Math.floor(Math.random() * course.structure.sections.reduce((total, section) => total + section.lectures.length, 0)),
            status: Math.random() > 0.1 ? 'active' : 'completed',
            lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            notes: 'Great course! Learning a lot.',
            bookmarks: []
          });
          await enrollment.save();
          console.log(`✅ Enrolled ${student.profile.firstName} in ${course.title}`);
        }
      }
    }

    // Update course enrollment counts
    console.log('📊 Updating course statistics...');
    for (const course of createdCourses) {
      const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
      const avgProgress = await Enrollment.aggregate([
        { $match: { courseId: course._id } },
        { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
      ]);
      
      course.enrollmentCount = enrollmentCount;
      course.avgProgressPct = avgProgress.length > 0 ? Math.round(avgProgress[0].avgProgress) : 0;
      await course.save();
    }

    // Create assignments
    console.log('📝 Creating assignments...');
    for (const course of createdCourses) {
      const assignment = new Assignment({
        courseId: course._id,
        title: `${course.title} - Final Project`,
        description: `Complete a comprehensive project demonstrating your understanding of ${course.title.toLowerCase()}.`,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        instructions: 'Create a complete project following the course guidelines. Submit your code and a brief explanation.',
        status: 'active',
        type: 'project',
        difficulty: course.level,
        estimatedTime: '2-4 hours',
        resources: [
          { title: 'Project Guidelines', url: 'https://example.com/resources/project-guidelines.pdf', type: 'pdf' },
          { title: 'Submission Template', url: 'https://example.com/resources/submission-template.pdf', type: 'pdf' }
        ]
      });
      await assignment.save();
      console.log(`✅ Created assignment: ${assignment.title}`);
    }

    // Create live sessions
    console.log('🎥 Creating live sessions...');
    for (const instructor of createdInstructors.slice(0, 3)) {
      const instructorCourses = createdCourses.filter(course => course.assignedInstructor.toString() === instructor._id.toString());
      
      if (instructorCourses.length > 0) {
        const course = instructorCourses[0];
        const session = new LiveSession({
          instructorId: instructor._id,
          courseId: course._id,
          title: `${course.title} - Live Q&A Session`,
          description: 'Join us for a live Q&A session where you can ask questions about the course material.',
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          status: 'scheduled',
          maxParticipants: 50,
          joinLink: `https://meet.example.com/session-${Math.random().toString(36).substr(2, 9)}`,
          recordingUrl: null,
          attendees: [],
          chatHistory: []
        });
        await session.save();
        console.log(`✅ Created live session: ${session.title}`);
      }
    }

    // Create products
    console.log('🛍️ Creating products...');
    const createdProducts = [];
    for (const productData of products) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        const product = new Product(productData);
        await product.save();
        createdProducts.push(product);
        console.log(`✅ Created product: ${product.name}`);
      } else {
        createdProducts.push(existingProduct);
        console.log(`⏭️  Product already exists: ${existingProduct.name}`);
      }
    }

    // Create orders
    console.log('🛒 Creating sample orders...');
    for (let i = 0; i < 8; i++) {
      const student = createdStudents[i];
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      
      const order = new Order({
        userId: student._id,
        items: [{
          productId: product._id,
          quantity: 1,
          price: product.price
        }],
        totalAmount: product.price,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        shippingAddress: {
          street: `${Math.floor(Math.random() * 9999)} Main St`,
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        billingAddress: {
          street: `${Math.floor(Math.random() * 9999)} Main St`,
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });
      await order.save();
      console.log(`✅ Created order for ${student.profile.firstName}: ${product.name}`);
    }

    // Create reviews
    console.log('⭐ Creating reviews...');
    for (const course of createdCourses) {
      const courseEnrollments = await Enrollment.find({ courseId: course._id }).limit(4);
      
      for (const enrollment of courseEnrollments) {
        const student = await User.findById(enrollment.studentId);
        const review = new Review({
          userId: student._id,
          courseId: course._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: `Excellent course! The instructor explains everything clearly and the projects are very helpful. The course structure is well-organized and easy to follow. Highly recommended for anyone looking to learn ${course.title.toLowerCase()}.`,
          createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
          helpful: Math.floor(Math.random() * 10) + 5,
          verified: true
        });
        await review.save();
        console.log(`✅ Created review by ${student.profile.firstName} for ${course.title}`);
      }
    }

    // Update course ratings
    console.log('📈 Updating course ratings...');
    for (const course of createdCourses) {
      const reviews = await Review.find({ courseId: course._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        course.rating = Math.round(avgRating * 10) / 10;
        course.reviewCount = reviews.length;
        await course.save();
      }
    }

    // Create user activities
    console.log('📊 Creating user activities...');
    for (const student of createdStudents) {
      const activities = [
        'course_enrolled',
        'lesson_completed',
        'assignment_submitted',
        'review_posted',
        'profile_updated'
      ];
      
      for (let i = 0; i < 10; i++) {
        const activity = new UserActivity({
          userId: student._id,
          action: activities[Math.floor(Math.random() * activities.length)],
          details: {
            courseId: createdCourses[Math.floor(Math.random() * createdCourses.length)]._id,
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          },
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        await activity.save();
      }
    }

    // Create audit logs
    console.log('📋 Creating audit logs...');
    const auditActions = ['course_created', 'user_registered', 'enrollment_created', 'assignment_submitted', 'review_posted', 'order_created'];
    for (let i = 0; i < 30; i++) {
      const user = [...createdInstructors, ...createdStudents][Math.floor(Math.random() * ([...createdInstructors, ...createdStudents].length))];
      const auditLog = new AuditLog({
        action: auditActions[Math.floor(Math.random() * auditActions.length)],
        actor: {
          userId: user._id,
          username: user.username,
          role: user.role
        },
        target: {
          type: 'course',
          id: createdCourses[Math.floor(Math.random() * createdCourses.length)]._id
        },
        metadata: {
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`
        },
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      await auditLog.save();
    }

    // Create admin settings
    console.log('⚙️ Creating admin settings...');
    const adminSettings = new AdminSettings({
      siteName: 'Slate LMS',
      siteDescription: 'Comprehensive Learning Management System',
      siteLogo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=200&fit=crop',
      contactEmail: 'admin@slate.com',
      supportEmail: 'support@slate.com',
      defaultCurrency: 'USD',
      timezone: 'UTC',
      features: {
        liveSessions: true,
        assignments: true,
        reviews: true,
        certificates: true,
        mobileApp: true
      },
      limits: {
        maxFileSize: 100, // MB
        maxCoursesPerInstructor: 50,
        maxStudentsPerCourse: 1000
      }
    });
    await adminSettings.save();
    console.log('✅ Created admin settings');

    console.log('🎉 Comprehensive data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   👨‍🏫 Instructors: ${createdInstructors.length}`);
    console.log(`   👨‍🎓 Students: ${createdStudents.length}`);
    console.log(`   📚 Courses: ${createdCourses.length}`);
    console.log(`   🛍️ Products: ${createdProducts.length}`);
    console.log(`   📝 Assignments: ${await Assignment.countDocuments()}`);
    console.log(`   🎥 Live Sessions: ${await LiveSession.countDocuments()}`);
    console.log(`   🛒 Orders: ${await Order.countDocuments()}`);
    console.log(`   ⭐ Reviews: ${await Review.countDocuments()}`);
    console.log(`   📊 User Activities: ${await UserActivity.countDocuments()}`);
    console.log(`   📋 Audit Logs: ${await AuditLog.countDocuments()}`);
    console.log(`   ⚙️ Admin Settings: 1`);

  } catch (error) {
    console.error('❌ Error during comprehensive data seeding:', error);
    throw error;
  }
};

export default seedComprehensiveData;

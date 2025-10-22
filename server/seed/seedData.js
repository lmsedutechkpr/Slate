import bcrypt from 'bcrypt';
import { User, Course, Enrollment, Assignment, LiveSession, Product, Review, AuditLog } from '../models/index.js';
import { UserRoles } from '../constants.js';

// Sample data arrays
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
      bio: 'Full-stack developer with 10+ years of experience in web development. Passionate about teaching modern technologies.',
      expertise: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      experience: '10+ years',
      education: 'MS Computer Science, Stanford University',
      certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
      hourlyRate: 75,
      availability: 'Monday-Friday, 9 AM - 6 PM EST'
    },
    status: 'active'
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
      bio: 'Data scientist and machine learning expert. Former Google engineer with expertise in AI and ML.',
      expertise: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'SQL'],
      experience: '8+ years',
      education: 'PhD Data Science, MIT',
      certifications: ['TensorFlow Developer Certificate', 'AWS Machine Learning Specialty'],
      hourlyRate: 90,
      availability: 'Monday-Friday, 10 AM - 7 PM EST'
    },
    status: 'active'
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
      bio: 'Mobile app developer specializing in iOS and Android. Created multiple successful apps with millions of downloads.',
      expertise: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'iOS', 'Android'],
      experience: '12+ years',
      education: 'BS Computer Engineering, UC Berkeley',
      certifications: ['Apple Certified iOS Developer', 'Google Android Developer'],
      hourlyRate: 85,
      availability: 'Monday-Friday, 8 AM - 5 PM PST'
    },
    status: 'active'
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
      bio: 'UI/UX designer and frontend developer. Expert in creating beautiful, user-friendly interfaces.',
      expertise: ['Figma', 'Adobe XD', 'React', 'Vue.js', 'CSS', 'Design Systems'],
      experience: '6+ years',
      education: 'BFA Graphic Design, Art Center College of Design',
      certifications: ['Google UX Design Certificate', 'Adobe Certified Expert'],
      hourlyRate: 70,
      availability: 'Monday-Friday, 9 AM - 6 PM EST'
    },
    status: 'active'
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
      bio: 'DevOps engineer and cloud architect. Expert in AWS, Docker, Kubernetes, and CI/CD pipelines.',
      expertise: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux'],
      experience: '9+ years',
      education: 'MS Software Engineering, Carnegie Mellon',
      certifications: ['AWS Solutions Architect', 'Certified Kubernetes Administrator'],
      hourlyRate: 95,
      availability: 'Monday-Friday, 8 AM - 6 PM EST'
    },
    status: 'active'
  }
];

const students = [
  {
    username: 'student1',
    email: 'student1@example.com',
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
      experience: 'beginner'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'student2',
    email: 'student2@example.com',
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
      experience: 'intermediate'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'student3',
    email: 'student3@example.com',
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
      experience: 'beginner'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'student4',
    email: 'student4@example.com',
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
      experience: 'intermediate'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'student5',
    email: 'student5@example.com',
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
      experience: 'beginner'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'student6',
    email: 'student6@example.com',
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
      experience: 'advanced'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'student7',
    email: 'student7@example.com',
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
      experience: 'intermediate'
    },
    status: 'active',
    completedOnboarding: true
  },
  {
    username: 'student8',
    email: 'student8@example.com',
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
      experience: 'beginner'
    },
    status: 'active',
    completedOnboarding: true
  }
];

const courses = [
  {
    title: 'Complete Web Development Bootcamp',
    description: 'Learn modern web development from scratch. Master HTML, CSS, JavaScript, React, Node.js, and more to build real-world applications.',
    category: 'Web Development',
    level: 'beginner',
    language: 'English',
    price: 199,
    tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
    coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'HTML Fundamentals',
          lectures: [
            {
              title: 'Introduction to HTML',
              videoUrl: 'https://example.com/videos/html-intro.mp4',
              durationSec: 1800,
              resources: [
                { title: 'HTML Cheat Sheet', url: 'https://example.com/resources/html-cheatsheet.pdf', type: 'pdf' },
                { title: 'MDN HTML Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'HTML Forms and Input Elements',
              videoUrl: 'https://example.com/videos/html-forms.mp4',
              durationSec: 2400,
              resources: [
                { title: 'Form Validation Guide', url: 'https://example.com/resources/form-validation.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'CSS Styling',
          lectures: [
            {
              title: 'CSS Basics and Selectors',
              videoUrl: 'https://example.com/videos/css-basics.mp4',
              durationSec: 2100,
              resources: [
                { title: 'CSS Selectors Reference', url: 'https://example.com/resources/css-selectors.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Flexbox and Grid Layout',
              videoUrl: 'https://example.com/videos/css-layout.mp4',
              durationSec: 2700,
              resources: [
                { title: 'Flexbox Froggy Game', url: 'https://flexboxfroggy.com/', type: 'link' }
              ],
              order: 2,
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
    reviewCount: 0
  },
  {
    title: 'React.js Complete Guide',
    description: 'Master React.js from fundamentals to advanced concepts. Build modern, scalable web applications with hooks, context, and best practices.',
    category: 'Frontend Development',
    level: 'intermediate',
    language: 'English',
    price: 149,
    tags: ['React', 'JavaScript', 'Hooks', 'Context', 'Redux'],
    coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'React Fundamentals',
          lectures: [
            {
              title: 'Introduction to React',
              videoUrl: 'https://example.com/videos/react-intro.mp4',
              durationSec: 2400,
              resources: [
                { title: 'React Documentation', url: 'https://reactjs.org/docs/getting-started.html', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Components and JSX',
              videoUrl: 'https://example.com/videos/react-components.mp4',
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
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python programming for data analysis, visualization, and machine learning. Perfect for beginners and intermediate learners.',
    category: 'Data Science',
    level: 'beginner',
    language: 'English',
    price: 179,
    tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Data Analysis'],
    coverUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'Python Basics',
          lectures: [
            {
              title: 'Python Fundamentals',
              videoUrl: 'https://example.com/videos/python-basics.mp4',
              durationSec: 2700,
              resources: [
                { title: 'Python Documentation', url: 'https://docs.python.org/3/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0
  },
  {
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile apps using React Native. Learn to create iOS and Android apps with a single codebase.',
    category: 'Mobile Development',
    level: 'intermediate',
    language: 'English',
    price: 229,
    tags: ['React Native', 'Mobile', 'iOS', 'Android', 'JavaScript'],
    coverUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'React Native Setup',
          lectures: [
            {
              title: 'Environment Setup',
              videoUrl: 'https://example.com/videos/rn-setup.mp4',
              durationSec: 1800,
              resources: [
                { title: 'React Native Docs', url: 'https://reactnative.dev/docs/getting-started', type: 'link' }
              ],
              order: 1,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Learn professional UI/UX design principles, tools, and workflows. Create beautiful, user-friendly interfaces.',
    category: 'Design',
    level: 'beginner',
    language: 'English',
    price: 159,
    tags: ['UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Design Systems'],
    coverUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'Design Fundamentals',
          lectures: [
            {
              title: 'Principles of Good Design',
              videoUrl: 'https://example.com/videos/design-principles.mp4',
              durationSec: 2400,
              resources: [
                { title: 'Design Principles Guide', url: 'https://example.com/resources/design-principles.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0
  },
  {
    title: 'AWS Cloud Architecture',
    description: 'Master AWS cloud services and architecture patterns. Learn to build scalable, secure cloud applications.',
    category: 'Cloud Computing',
    level: 'advanced',
    language: 'English',
    price: 299,
    tags: ['AWS', 'Cloud', 'DevOps', 'Architecture', 'Scalability'],
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'AWS Fundamentals',
          lectures: [
            {
              title: 'Introduction to AWS',
              videoUrl: 'https://example.com/videos/aws-intro.mp4',
              durationSec: 3000,
              resources: [
                { title: 'AWS Documentation', url: 'https://docs.aws.amazon.com/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        }
      ]
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 0,
    avgProgressPct: 0,
    rating: 0,
    reviewCount: 0
  }
];

const products = [
  {
    name: 'Premium Course Bundle',
    description: 'Get access to all premium courses with lifetime updates and exclusive content.',
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
      'Certificate of completion'
    ]
  },
  {
    name: '1-on-1 Mentoring Session',
    description: 'Personalized 1-hour mentoring session with industry experts.',
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
      'Follow-up resources'
    ]
  },
  {
    name: 'Project Portfolio Review',
    description: 'Get your projects reviewed by professionals and improve your portfolio.',
    price: 99,
    category: 'Service',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    stock: 100,
    isActive: true,
    features: [
      'Detailed feedback',
      'Improvement suggestions',
      'Best practices guide',
      'Portfolio optimization tips'
    ]
  },
  {
    name: 'Coding Bootcamp Prep',
    description: 'Intensive preparation course for coding bootcamp interviews.',
    price: 199,
    category: 'Course',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
    stock: 200,
    isActive: true,
    features: [
      'Interview preparation',
      'Coding challenges',
      'Mock interviews',
      'Resume review',
      'Success strategies'
    ]
  }
];

export const seedAllData = async () => {
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
      const enrolledStudents = createdStudents.slice(0, Math.floor(Math.random() * 5) + 2); // 2-6 students per course
      
      for (const student of enrolledStudents) {
        const existingEnrollment = await Enrollment.findOne({ 
          studentId: student._id, 
          courseId: course._id 
        });
        
        if (!existingEnrollment) {
          const enrollment = new Enrollment({
            studentId: student._id,
            courseId: course._id,
            enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            progress: Math.floor(Math.random() * 100),
            completedLessons: Math.floor(Math.random() * course.structure.sections.reduce((total, section) => total + section.lectures.length, 0)),
            status: Math.random() > 0.1 ? 'active' : 'completed'
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
    for (const course of createdCourses.slice(0, 4)) { // Create assignments for first 4 courses
      const assignment = new Assignment({
        courseId: course._id,
        title: `${course.title} - Final Project`,
        description: `Complete a comprehensive project demonstrating your understanding of ${course.title.toLowerCase()}.`,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 2 weeks
        maxScore: 100,
        instructions: 'Create a complete project following the course guidelines. Submit your code and a brief explanation.',
        status: 'active'
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
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
          endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour duration
          status: 'scheduled',
          maxParticipants: 50,
          joinLink: `https://meet.example.com/session-${Math.random().toString(36).substr(2, 9)}`
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

    // Create some sample orders (commented out - Order model not available)
    // console.log('🛒 Creating sample orders...');
    // for (let i = 0; i < 5; i++) {
    //   const student = createdStudents[i];
    //   const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
    //   
    //   const order = new Order({
    //     userId: student._id,
    //     items: [{
    //       productId: product._id,
    //       quantity: 1,
    //       price: product.price
    //     }],
    //     totalAmount: product.price,
    //     status: 'completed',
    //     paymentStatus: 'paid',
    //     createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    //   });
    //   await order.save();
    //   console.log(`✅ Created order for ${student.profile.firstName}: ${product.name}`);
    // }

    // Create reviews
    console.log('⭐ Creating reviews...');
    for (const course of createdCourses.slice(0, 3)) {
      const courseEnrollments = await Enrollment.find({ courseId: course._id }).limit(3);
      
      for (const enrollment of courseEnrollments) {
        const student = await User.findById(enrollment.studentId);
        const review = new Review({
          userId: student._id,
          courseId: course._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: `Great course! The instructor explains everything clearly and the projects are very helpful. Highly recommended!`,
          createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
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

    // Create audit logs
    console.log('📋 Creating audit logs...');
    const auditActions = ['course_created', 'user_registered', 'enrollment_created', 'assignment_submitted'];
    for (let i = 0; i < 20; i++) {
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
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      await auditLog.save();
    }

    console.log('🎉 Comprehensive data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   👨‍🏫 Instructors: ${createdInstructors.length}`);
    console.log(`   👨‍🎓 Students: ${createdStudents.length}`);
    console.log(`   📚 Courses: ${createdCourses.length}`);
    console.log(`   🛍️ Products: ${createdProducts.length}`);
    console.log(`   📝 Assignments: ${await Assignment.countDocuments()}`);
    console.log(`   🎥 Live Sessions: ${await LiveSession.countDocuments()}`);
    console.log(`   ⭐ Reviews: ${await Review.countDocuments()}`);
    console.log(`   📋 Audit Logs: ${await AuditLog.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  }
};

export default seedAllData;

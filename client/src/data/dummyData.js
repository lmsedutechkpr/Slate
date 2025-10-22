// Dummy data for immediate frontend testing
export const dummyUsers = {
  admin: {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@slate.com',
    role: 'admin',
    profile: {
      firstName: 'System',
      lastName: 'Administrator',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    status: 'active'
  },
  instructors: [
    {
      id: 'instructor-1',
      username: 'john_doe',
      email: 'john.doe@example.com',
      role: 'instructor',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        phone: '+1-555-0101'
      },
      instructorProfile: {
        bio: 'Full-stack developer with 10+ years of experience in web development.',
        expertise: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        experience: '10+ years',
        education: 'MS Computer Science, Stanford University',
        hourlyRate: 75,
        availability: 'Monday-Friday, 9 AM - 6 PM EST'
      },
      status: 'active',
      coursesCount: 3,
      studentsCount: 25,
      rating: 4.8,
      totalEarnings: 12500
    },
    {
      id: 'instructor-2',
      username: 'sarah_wilson',
      email: 'sarah.wilson@example.com',
      role: 'instructor',
      profile: {
        firstName: 'Sarah',
        lastName: 'Wilson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        phone: '+1-555-0102'
      },
      instructorProfile: {
        bio: 'Data scientist and machine learning expert. Former Google engineer.',
        expertise: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'SQL'],
        experience: '8+ years',
        education: 'PhD Data Science, MIT',
        hourlyRate: 90,
        availability: 'Monday-Friday, 10 AM - 7 PM EST'
      },
      status: 'active',
      coursesCount: 2,
      studentsCount: 18,
      rating: 4.9,
      totalEarnings: 9800
    },
    {
      id: 'instructor-3',
      username: 'mike_chen',
      email: 'mike.chen@example.com',
      role: 'instructor',
      profile: {
        firstName: 'Mike',
        lastName: 'Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        phone: '+1-555-0103'
      },
      instructorProfile: {
        bio: 'Mobile app developer specializing in iOS and Android.',
        expertise: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'iOS', 'Android'],
        experience: '12+ years',
        education: 'BS Computer Engineering, UC Berkeley',
        hourlyRate: 85,
        availability: 'Monday-Friday, 8 AM - 5 PM PST'
      },
      status: 'active',
      coursesCount: 4,
      studentsCount: 32,
      rating: 4.7,
      totalEarnings: 15200
    }
  ],
  students: [
    {
      id: 'student-1',
      username: 'alice_johnson',
      email: 'alice.johnson@example.com',
      role: 'student',
      profile: {
        firstName: 'Alice',
        lastName: 'Johnson',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        phone: '+1-555-0201'
      },
      studentProfile: {
        interests: ['webdev', 'mobile'],
        domains: ['tech', 'business'],
        learningPace: 'moderate',
        goals: 'Career change to software development',
        experience: 'beginner'
      },
      status: 'active',
      enrolledCourses: 3,
      completedCourses: 1,
      totalXP: 1250,
      currentStreak: 7
    },
    {
      id: 'student-2',
      username: 'bob_smith',
      email: 'bob.smith@example.com',
      role: 'student',
      profile: {
        firstName: 'Bob',
        lastName: 'Smith',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        phone: '+1-555-0202'
      },
      studentProfile: {
        interests: ['data', 'ai'],
        domains: ['tech', 'science'],
        learningPace: 'fast',
        goals: 'Become a data scientist',
        experience: 'intermediate'
      },
      status: 'active',
      enrolledCourses: 2,
      completedCourses: 2,
      totalXP: 2100,
      currentStreak: 12
    },
    {
      id: 'student-3',
      username: 'carol_brown',
      email: 'carol.brown@example.com',
      role: 'student',
      profile: {
        firstName: 'Carol',
        lastName: 'Brown',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        phone: '+1-555-0203'
      },
      studentProfile: {
        interests: ['design', 'webdev'],
        domains: ['creative', 'tech'],
        learningPace: 'moderate',
        goals: 'Learn UI/UX design',
        experience: 'beginner'
      },
      status: 'active',
      enrolledCourses: 4,
      completedCourses: 0,
      totalXP: 800,
      currentStreak: 3
    }
  ]
};

export const dummyCourses = [
  {
    id: 'course-1',
    title: 'Complete Web Development Bootcamp',
    description: 'Learn modern web development from scratch. Master HTML, CSS, JavaScript, React, Node.js, and more to build real-world applications.',
    category: 'Web Development',
    level: 'beginner',
    language: 'English',
    price: 199,
    tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
    coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    instructor: {
      id: 'instructor-1',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 156,
    avgProgressPct: 68,
    rating: 4.8,
    reviewCount: 89,
    duration: '40 hours',
    lessons: 25,
    difficulty: 'beginner',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20'
  },
  {
    id: 'course-2',
    title: 'React.js Complete Guide',
    description: 'Master React.js from fundamentals to advanced concepts. Build modern, scalable web applications with hooks, context, and best practices.',
    category: 'Frontend Development',
    level: 'intermediate',
    language: 'English',
    price: 149,
    tags: ['React', 'JavaScript', 'Hooks', 'Context', 'Redux'],
    coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    instructor: {
      id: 'instructor-1',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 98,
    avgProgressPct: 72,
    rating: 4.9,
    reviewCount: 67,
    duration: '25 hours',
    lessons: 18,
    difficulty: 'intermediate',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-18'
  },
  {
    id: 'course-3',
    title: 'Python for Data Science',
    description: 'Learn Python programming for data analysis, visualization, and machine learning. Perfect for beginners and intermediate learners.',
    category: 'Data Science',
    level: 'beginner',
    language: 'English',
    price: 179,
    tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Data Analysis'],
    coverUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
    instructor: {
      id: 'instructor-2',
      name: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 124,
    avgProgressPct: 65,
    rating: 4.7,
    reviewCount: 78,
    duration: '30 hours',
    lessons: 22,
    difficulty: 'beginner',
    createdAt: '2024-01-10',
    updatedAt: '2024-02-15'
  },
  {
    id: 'course-4',
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile apps using React Native. Learn to create iOS and Android apps with a single codebase.',
    category: 'Mobile Development',
    level: 'intermediate',
    language: 'English',
    price: 229,
    tags: ['React Native', 'Mobile', 'iOS', 'Android', 'JavaScript'],
    coverUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop',
    instructor: {
      id: 'instructor-3',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    isPublished: true,
    status: 'published',
    enrollmentCount: 87,
    avgProgressPct: 58,
    rating: 4.6,
    reviewCount: 45,
    duration: '35 hours',
    lessons: 28,
    difficulty: 'intermediate',
    createdAt: '2024-01-25',
    updatedAt: '2024-02-22'
  }
];

export const dummyProducts = [
  {
    id: 'product-1',
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
    ],
    sales: 156,
    rating: 4.9
  },
  {
    id: 'product-2',
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
    ],
    sales: 89,
    rating: 4.8
  },
  {
    id: 'product-3',
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
    ],
    sales: 67,
    rating: 4.7
  }
];

export const dummyOrders = [
  {
    id: 'order-1',
    userId: 'student-1',
    user: {
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com'
    },
    items: [
      {
        productId: 'product-1',
        productName: 'Premium Course Bundle',
        quantity: 1,
        price: 499
      }
    ],
    totalAmount: 499,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: '2024-02-15',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    }
  },
  {
    id: 'order-2',
    userId: 'student-2',
    user: {
      name: 'Bob Smith',
      email: 'bob.smith@example.com'
    },
    items: [
      {
        productId: 'product-2',
        productName: '1-on-1 Mentoring Session',
        quantity: 1,
        price: 150
      }
    ],
    totalAmount: 150,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: '2024-02-18',
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA'
    }
  }
];

export const dummyAnalytics = {
  overview: {
    totalUsers: 156,
    totalCourses: 4,
    totalRevenue: 45600,
    totalEnrollments: 465,
    monthlyGrowth: 12.5,
    activeUsers: 89,
    completionRate: 68.5
  },
  revenue: {
    monthly: [
      { month: 'Jan', revenue: 8500 },
      { month: 'Feb', revenue: 12300 },
      { month: 'Mar', revenue: 9800 },
      { month: 'Apr', revenue: 15000 }
    ],
    daily: [
      { date: '2024-02-20', revenue: 450 },
      { date: '2024-02-21', revenue: 680 },
      { date: '2024-02-22', revenue: 520 },
      { date: '2024-02-23', revenue: 890 }
    ]
  },
  enrollments: {
    byCourse: [
      { course: 'Complete Web Development Bootcamp', enrollments: 156 },
      { course: 'React.js Complete Guide', enrollments: 98 },
      { course: 'Python for Data Science', enrollments: 124 },
      { course: 'Mobile App Development', enrollments: 87 }
    ],
    byMonth: [
      { month: 'Jan', enrollments: 89 },
      { month: 'Feb', enrollments: 156 },
      { month: 'Mar', enrollments: 134 },
      { month: 'Apr', enrollments: 186 }
    ]
  },
  users: {
    byRole: [
      { role: 'Student', count: 145 },
      { role: 'Instructor', count: 8 },
      { role: 'Admin', count: 3 }
    ],
    byStatus: [
      { status: 'Active', count: 142 },
      { status: 'Inactive', count: 14 }
    ]
  }
};

export const dummyLiveSessions = [
  {
    id: 'session-1',
    title: 'Web Development Q&A Session',
    description: 'Join us for a live Q&A session about web development fundamentals.',
    instructor: {
      id: 'instructor-1',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    course: {
      id: 'course-1',
      title: 'Complete Web Development Bootcamp'
    },
    startAt: '2024-02-25T15:00:00Z',
    endAt: '2024-02-25T16:00:00Z',
    status: 'scheduled',
    maxParticipants: 50,
    currentParticipants: 23,
    joinLink: 'https://meet.example.com/session-1'
  },
  {
    id: 'session-2',
    title: 'Data Science Workshop',
    description: 'Hands-on workshop on Python data analysis techniques.',
    instructor: {
      id: 'instructor-2',
      name: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    course: {
      id: 'course-3',
      title: 'Python for Data Science'
    },
    startAt: '2024-02-26T14:00:00Z',
    endAt: '2024-02-26T15:30:00Z',
    status: 'scheduled',
    maxParticipants: 30,
    currentParticipants: 18,
    joinLink: 'https://meet.example.com/session-2'
  }
];

export const dummyAssignments = [
  {
    id: 'assignment-1',
    title: 'Build a Personal Portfolio Website',
    description: 'Create a responsive portfolio website using HTML, CSS, and JavaScript.',
    course: {
      id: 'course-1',
      title: 'Complete Web Development Bootcamp'
    },
    dueDate: '2024-03-01T23:59:59Z',
    maxScore: 100,
    status: 'active',
    submissions: 45,
    averageScore: 87.5,
    instructions: 'Create a responsive portfolio website with at least 3 sections: About, Projects, and Contact.'
  },
  {
    id: 'assignment-2',
    title: 'React Component Library',
    description: 'Build a reusable component library using React and TypeScript.',
    course: {
      id: 'course-2',
      title: 'React.js Complete Guide'
    },
    dueDate: '2024-03-05T23:59:59Z',
    maxScore: 100,
    status: 'active',
    submissions: 32,
    averageScore: 82.3,
    instructions: 'Create at least 5 reusable components with proper TypeScript interfaces.'
  }
];

export const dummyReviews = [
  {
    id: 'review-1',
    userId: 'student-1',
    user: {
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    },
    courseId: 'course-1',
    course: {
      title: 'Complete Web Development Bootcamp'
    },
    rating: 5,
    comment: 'Excellent course! The instructor explains everything clearly and the projects are very helpful. Highly recommended!',
    createdAt: '2024-02-10',
    helpful: 12,
    verified: true
  },
  {
    id: 'review-2',
    userId: 'student-2',
    user: {
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    courseId: 'course-2',
    course: {
      title: 'React.js Complete Guide'
    },
    rating: 5,
    comment: 'Great React course! The instructor covers all the important concepts with practical examples.',
    createdAt: '2024-02-12',
    helpful: 8,
    verified: true
  }
];

// Mock API functions that return dummy data
export const mockAPI = {
  // Auth
  login: (credentials) => {
    const { email, password } = credentials;
    
    // Check admin
    if (email === 'admin@slate.com' && password === 'Admin@123456') {
      return Promise.resolve({
        success: true,
        user: dummyUsers.admin,
        token: 'mock-admin-token'
      });
    }
    
    // Check instructors
    const instructor = dummyUsers.instructors.find(inst => inst.email === email);
    if (instructor && password === 'Instructor123!') {
      return Promise.resolve({
        success: true,
        user: instructor,
        token: 'mock-instructor-token'
      });
    }
    
    // Check students
    const student = dummyUsers.students.find(std => std.email === email);
    if (student && password === 'Student123!') {
      return Promise.resolve({
        success: true,
        user: student,
        token: 'mock-student-token'
      });
    }
    
    return Promise.resolve({
      success: false,
      message: 'Invalid credentials'
    });
  },

  // Users
  getUsers: () => Promise.resolve(dummyUsers),
  getInstructors: () => Promise.resolve(dummyUsers.instructors),
  getStudents: () => Promise.resolve(dummyUsers.students),

  // Courses
  getCourses: () => Promise.resolve(dummyCourses),
  getCourseById: (id) => Promise.resolve(dummyCourses.find(c => c.id === id)),

  // Products
  getProducts: () => Promise.resolve(dummyProducts),

  // Orders
  getOrders: () => Promise.resolve(dummyOrders),

  // Analytics
  getAnalytics: () => Promise.resolve(dummyAnalytics),

  // Live Sessions
  getLiveSessions: () => Promise.resolve(dummyLiveSessions),

  // Assignments
  getAssignments: () => Promise.resolve(dummyAssignments),

  // Reviews
  getReviews: () => Promise.resolve(dummyReviews)
};

export default {
  dummyUsers,
  dummyCourses,
  dummyProducts,
  dummyOrders,
  dummyAnalytics,
  dummyLiveSessions,
  dummyAssignments,
  dummyReviews,
  mockAPI
};

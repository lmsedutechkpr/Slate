import express from 'express';
import connectDB from '../db.js';
import bcrypt from 'bcrypt';
import { 
  User, Course, Enrollment, Assignment, LiveSession, Product, Review, AuditLog, 
  Role, Order, Payment, ProductBundle, TransactionLog, UserActivity, AdminSettings 
} from '../models/index.js';
import { UserRoles } from '../constants.js';

const router = express.Router();

// Simple seeding endpoint that works reliably
router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Check if data already exists
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    
    if (userCount > 0 && courseCount > 0) {
      return res.json({
        success: true,
        message: 'Database already seeded',
        counts: {
          users: userCount,
          courses: courseCount
        }
      });
    }
    
    // Hash passwords
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 10);
    };

    // Create admin user
    console.log('👑 Creating admin user...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@slate.com',
      password: await hashPassword('Admin@123456'),
      role: UserRoles.ADMIN,
      profile: {
        firstName: 'System',
        lastName: 'Administrator'
      },
      status: 'active'
    });
    await adminUser.save();
    console.log('✅ Admin user created');

    // Create roles
    console.log('📋 Creating roles...');
    const roles = [
      {
        name: 'Administrator',
        description: 'Full system access',
        color: '#DC2626',
        icon: 'shield',
        isSystemRole: true,
        permissions: [
          { module: 'USER_MANAGEMENT', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update', 'delete'] },
          { module: 'ANALYTICS', actions: ['read', 'export'] }
        ]
      },
      {
        name: 'Instructor',
        description: 'Can manage courses',
        color: '#2563EB',
        icon: 'users',
        isSystemRole: true,
        permissions: [
          { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update'] }
        ]
      },
      {
        name: 'Student',
        description: 'Can access courses',
        color: '#059669',
        icon: 'graduation-cap',
        isSystemRole: true,
        permissions: []
      }
    ];
    await Role.insertMany(roles);
    console.log('✅ Roles created');

    // Create instructors
    console.log('👨‍🏫 Creating instructors...');
    const instructors = [
      {
        username: 'john_doe',
        email: 'john.doe@example.com',
        password: await hashPassword('Instructor123!'),
        role: UserRoles.INSTRUCTOR,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        instructorProfile: {
          bio: 'Full-stack developer with 10+ years of experience.',
          expertise: ['JavaScript', 'React', 'Node.js'],
          experience: '10+ years',
          hourlyRate: 75
        },
        status: 'active'
      },
      {
        username: 'sarah_wilson',
        email: 'sarah.wilson@example.com',
        password: await hashPassword('Instructor123!'),
        role: UserRoles.INSTRUCTOR,
        profile: {
          firstName: 'Sarah',
          lastName: 'Wilson',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        },
        instructorProfile: {
          bio: 'Data scientist and ML expert.',
          expertise: ['Python', 'Machine Learning', 'Data Science'],
          experience: '8+ years',
          hourlyRate: 90
        },
        status: 'active'
      }
    ];

    const createdInstructors = [];
    for (const instructorData of instructors) {
      const instructor = new User(instructorData);
      await instructor.save();
      createdInstructors.push(instructor);
      console.log(`✅ Created instructor: ${instructor.profile.firstName}`);
    }

    // Create students
    console.log('👨‍🎓 Creating students...');
    const students = [
      {
        username: 'alice_johnson',
        email: 'alice.johnson@example.com',
        password: await hashPassword('Student123!'),
        role: UserRoles.STUDENT,
        profile: {
          firstName: 'Alice',
          lastName: 'Johnson',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
        },
        studentProfile: {
          interests: ['webdev', 'mobile'],
          domains: ['tech'],
          learningPace: 'moderate',
          goals: 'Career change to software development',
          experience: 'beginner'
        },
        status: 'active',
        completedOnboarding: true
      },
      {
        username: 'bob_smith',
        email: 'bob.smith@example.com',
        password: await hashPassword('Student123!'),
        role: UserRoles.STUDENT,
        profile: {
          firstName: 'Bob',
          lastName: 'Smith',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        studentProfile: {
          interests: ['data', 'ai'],
          domains: ['tech'],
          learningPace: 'fast',
          goals: 'Become a data scientist',
          experience: 'intermediate'
        },
        status: 'active',
        completedOnboarding: true
      }
    ];

    const createdStudents = [];
    for (const studentData of students) {
      const student = new User(studentData);
      await student.save();
      createdStudents.push(student);
      console.log(`✅ Created student: ${student.profile.firstName}`);
    }

    // Create courses
    console.log('📚 Creating courses...');
    const courses = [
      {
        title: 'Complete Web Development Bootcamp',
        description: 'Learn modern web development from scratch. Master HTML, CSS, JavaScript, React, Node.js.',
        category: 'Web Development',
        level: 'beginner',
        language: 'English',
        price: 199,
        tags: ['HTML', 'CSS', 'JavaScript', 'React'],
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
                    { title: 'HTML Cheat Sheet', url: 'https://example.com/resources/html-cheatsheet.pdf', type: 'pdf' }
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
        title: 'React.js Complete Guide',
        description: 'Master React.js from fundamentals to advanced concepts.',
        category: 'Frontend Development',
        level: 'intermediate',
        language: 'English',
        price: 149,
        tags: ['React', 'JavaScript', 'Hooks'],
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

    const createdCourses = [];
    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];
      const instructor = createdInstructors[i % createdInstructors.length];
      
      courseData.createdBy = instructor._id;
      courseData.assignedInstructor = instructor._id;
      const course = new Course(courseData);
      await course.save();
      createdCourses.push(course);
      console.log(`✅ Created course: ${course.title}`);
    }

    // Create enrollments
    console.log('🎯 Creating enrollments...');
    for (const course of createdCourses) {
      for (const student of createdStudents) {
        const enrollment = new Enrollment({
          studentId: student._id,
          courseId: course._id,
          enrolledAt: new Date(),
          progress: Math.floor(Math.random() * 80) + 10,
          completedLessons: Math.floor(Math.random() * 2),
          status: 'active'
        });
        await enrollment.save();
      }
    }

    // Create products
    console.log('🛍️ Creating products...');
    const products = [
      {
        name: 'Premium Course Bundle',
        description: 'Get access to all premium courses with lifetime updates.',
        price: 499,
        category: 'Bundle',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
        stock: 1000,
        isActive: true,
        features: ['Access to all courses', 'Lifetime updates', 'Priority support']
      },
      {
        name: '1-on-1 Mentoring Session',
        description: 'Personalized mentoring session with experts.',
        price: 150,
        category: 'Service',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
        stock: 50,
        isActive: true,
        features: ['1-hour session', 'Personalized guidance', 'Career advice']
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create reviews
    console.log('⭐ Creating reviews...');
    for (const course of createdCourses) {
      for (const student of createdStudents) {
        const review = new Review({
          userId: student._id,
          courseId: course._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: 'Excellent course! Very helpful and well-structured.',
          createdAt: new Date()
        });
        await review.save();
      }
    }

    // Update course statistics
    console.log('📊 Updating course statistics...');
    for (const course of createdCourses) {
      const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
      const reviews = await Review.find({ courseId: course._id });
      
      course.enrollmentCount = enrollmentCount;
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        course.rating = Math.round(avgRating * 10) / 10;
        course.reviewCount = reviews.length;
      }
      await course.save();
    }

    console.log('🎉 Database seeding completed successfully!');
    
    res.json({
      success: true,
      message: 'Database seeded successfully!',
      credentials: {
        admin: 'admin@slate.com / Admin@123456',
        instructor: 'john.doe@example.com / Instructor123!',
        student: 'alice.johnson@example.com / Student123!'
      },
      counts: {
        users: await User.countDocuments(),
        courses: await Course.countDocuments(),
        products: await Product.countDocuments(),
        enrollments: await Enrollment.countDocuments(),
        reviews: await Review.countDocuments()
      }
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    res.status(500).json({
      success: false,
      message: 'Seeding failed: ' + error.message
    });
  }
});

// Check seeding status
router.get('/status', async (req, res) => {
  try {
    await connectDB();
    
    const counts = {
      users: await User.countDocuments(),
      courses: await Course.countDocuments(),
      products: await Product.countDocuments(),
      enrollments: await Enrollment.countDocuments(),
      reviews: await Review.countDocuments()
    };
    
    const isSeeded = counts.users > 0 && counts.courses > 0;
    
    res.json({
      success: true,
      isSeeded,
      counts,
      message: isSeeded ? 'Database is seeded' : 'Database needs seeding'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check seeding status: ' + error.message
    });
  }
});

export default router;

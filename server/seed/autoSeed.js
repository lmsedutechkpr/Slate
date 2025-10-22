import connectDB from '../db.js';
import bcrypt from 'bcrypt';
import { 
  User, Course, Enrollment, Assignment, LiveSession, Product, Review, AuditLog, 
  Role, Order, Payment, ProductBundle, TransactionLog, UserActivity, AdminSettings 
} from '../models/index.js';
import { UserRoles } from '../constants.js';

// Auto-seed function that runs on server startup
export const autoSeedDatabase = async () => {
  try {
    console.log('🌱 Checking if database needs seeding...');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: UserRoles.ADMIN });
    const coursesExist = await Course.countDocuments();
    const productsExist = await Product.countDocuments();
    
    if (adminExists && coursesExist > 0 && productsExist > 0) {
      console.log('✅ Database already seeded, skipping auto-seed');
      return;
    }
    
    console.log('🚀 Auto-seeding database with comprehensive data...');
    
    // Hash passwords
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 10);
    };

    // Create admin user
    if (!adminExists) {
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
      console.log('✅ Admin user created: admin@slate.com / Admin@123456');
    }

    // Create roles if they don't exist
    const rolesExist = await Role.countDocuments();
    if (rolesExist === 0) {
      console.log('📋 Creating system roles...');
      const systemRoles = [
        {
          name: 'Administrator',
          description: 'Full system access and control',
          color: '#DC2626',
          icon: 'shield',
          isSystemRole: true,
          permissions: [
            { module: 'USER_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'reset_password', 'ban_user'] },
            { module: 'INSTRUCTOR_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'assign_courses'] },
            { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'publish', 'manage_content'] },
            { module: 'ANALYTICS', actions: ['read', 'export', 'create_reports'] },
            { module: 'SYSTEM_SETTINGS', actions: ['read', 'update', 'manage_payment', 'configure_email', 'manage_integrations'] }
          ]
        },
        {
          name: 'Instructor',
          description: 'Can manage courses and students',
          color: '#2563EB',
          icon: 'users',
          isSystemRole: true,
          permissions: [
            { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update', 'manage_content'] },
            { module: 'ANALYTICS', actions: ['read'] }
          ]
        },
        {
          name: 'Student',
          description: 'Can access courses and learning materials',
          color: '#059669',
          icon: 'graduation-cap',
          isSystemRole: true,
          permissions: []
        }
      ];
      await Role.insertMany(systemRoles);
      console.log('✅ System roles created');
    }

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
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          phone: '+1-555-0101',
          dateOfBirth: '1985-03-15',
          gender: 'male'
        },
        instructorProfile: {
          bio: 'Full-stack developer with 10+ years of experience in web development.',
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
        password: await hashPassword('Instructor123!'),
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
          bio: 'Data scientist and machine learning expert. Former Google engineer.',
          expertise: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'SQL'],
          experience: '8+ years',
          education: 'PhD Data Science, MIT',
          certifications: ['TensorFlow Developer Certificate', 'AWS Machine Learning Specialty'],
          hourlyRate: 90,
          availability: 'Monday-Friday, 10 AM - 7 PM EST'
        },
        status: 'active'
      }
    ];

    const createdInstructors = [];
    for (const instructorData of instructors) {
      const existingInstructor = await User.findOne({ email: instructorData.email });
      if (!existingInstructor) {
        const instructor = new User(instructorData);
        await instructor.save();
        createdInstructors.push(instructor);
        console.log(`✅ Created instructor: ${instructor.profile.firstName} ${instructor.profile.lastName}`);
      } else {
        createdInstructors.push(existingInstructor);
      }
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
        username: 'bob_smith',
        email: 'bob.smith@example.com',
        password: await hashPassword('Student123!'),
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
      }
    ];

    const createdStudents = [];
    for (const studentData of students) {
      const existingStudent = await User.findOne({ email: studentData.email });
      if (!existingStudent) {
        const student = new User(studentData);
        await student.save();
        createdStudents.push(student);
        console.log(`✅ Created student: ${student.profile.firstName} ${student.profile.lastName}`);
      } else {
        createdStudents.push(existingStudent);
      }
    }

    // Create courses
    console.log('📚 Creating courses...');
    const courses = [
      {
        title: 'Complete Web Development Bootcamp',
        description: 'Learn modern web development from scratch. Master HTML, CSS, JavaScript, React, Node.js, and more.',
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
        description: 'Master React.js from fundamentals to advanced concepts. Build modern, scalable web applications.',
        category: 'Frontend Development',
        level: 'intermediate',
        language: 'English',
        price: 149,
        tags: ['React', 'JavaScript', 'Hooks', 'Context'],
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
      
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (!existingCourse) {
        courseData.createdBy = instructor._id;
        courseData.assignedInstructor = instructor._id;
        const course = new Course(courseData);
        await course.save();
        createdCourses.push(course);
        console.log(`✅ Created course: ${course.title}`);
      } else {
        createdCourses.push(existingCourse);
      }
    }

    // Create enrollments
    console.log('🎯 Creating enrollments...');
    for (const course of createdCourses) {
      for (const student of createdStudents) {
        const existingEnrollment = await Enrollment.findOne({ 
          studentId: student._id, 
          courseId: course._id 
        });
        
        if (!existingEnrollment) {
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
        features: [
          'Access to all courses',
          'Lifetime updates',
          'Exclusive content',
          'Priority support'
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
          'Code review'
        ]
      }
    ];

    for (const productData of products) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        const product = new Product(productData);
        await product.save();
        console.log(`✅ Created product: ${product.name}`);
      }
    }

    // Create reviews
    console.log('⭐ Creating reviews...');
    for (const course of createdCourses) {
      for (const student of createdStudents.slice(0, 2)) {
        const existingReview = await Review.findOne({ 
          userId: student._id, 
          courseId: course._id 
        });
        
        if (!existingReview) {
          const review = new Review({
            userId: student._id,
            courseId: course._id,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            comment: `Excellent course! The instructor explains everything clearly and the projects are very helpful.`,
            createdAt: new Date()
          });
          await review.save();
        }
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

    console.log('🎉 Auto-seeding completed successfully!');
    console.log('📝 Login Credentials:');
    console.log('   Admin: admin@slate.com / Admin@123456');
    console.log('   Instructor: john.doe@example.com / Instructor123!');
    console.log('   Student: alice.johnson@example.com / Student123!');

  } catch (error) {
    console.error('❌ Auto-seeding failed:', error);
  }
};

export default autoSeedDatabase;

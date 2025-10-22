import bcrypt from 'bcrypt';
import { User, Course, Enrollment, Assignment, LiveSession, Product, Review, AuditLog } from '../models/index.js';
import { UserRoles } from '../constants.js';

// Additional comprehensive course data
const additionalCourses = [
  {
    title: 'JavaScript ES6+ Mastery',
    description: 'Master modern JavaScript features including ES6, ES7, ES8, and beyond. Learn async/await, modules, destructuring, and more.',
    category: 'Programming',
    level: 'intermediate',
    language: 'English',
    price: 129,
    tags: ['JavaScript', 'ES6', 'ES7', 'ES8', 'Modern JS'],
    coverUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'ES6 Fundamentals',
          lectures: [
            {
              title: 'Arrow Functions and Lexical This',
              videoUrl: 'https://example.com/videos/es6-arrow-functions.mp4',
              durationSec: 1800,
              resources: [
                { title: 'Arrow Functions Guide', url: 'https://example.com/resources/arrow-functions.pdf', type: 'pdf' },
                { title: 'MDN Arrow Functions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Destructuring Assignment',
              videoUrl: 'https://example.com/videos/es6-destructuring.mp4',
              durationSec: 2100,
              resources: [
                { title: 'Destructuring Examples', url: 'https://example.com/resources/destructuring-examples.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            },
            {
              title: 'Template Literals and String Methods',
              videoUrl: 'https://example.com/videos/es6-template-literals.mp4',
              durationSec: 1500,
              resources: [
                { title: 'Template Literals Reference', url: 'https://example.com/resources/template-literals.pdf', type: 'pdf' }
              ],
              order: 3,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'Advanced ES6+ Features',
          lectures: [
            {
              title: 'Promises and Async/Await',
              videoUrl: 'https://example.com/videos/es6-promises-async.mp4',
              durationSec: 2700,
              resources: [
                { title: 'Async/Await Guide', url: 'https://example.com/resources/async-await.pdf', type: 'pdf' },
                { title: 'Promise Examples', url: 'https://example.com/resources/promise-examples.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Modules and Import/Export',
              videoUrl: 'https://example.com/videos/es6-modules.mp4',
              durationSec: 2400,
              resources: [
                { title: 'ES6 Modules Guide', url: 'https://example.com/resources/es6-modules.pdf', type: 'pdf' }
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
    title: 'Node.js Backend Development',
    description: 'Build robust backend applications with Node.js, Express, MongoDB, and modern development practices.',
    category: 'Backend Development',
    level: 'intermediate',
    language: 'English',
    price: 189,
    tags: ['Node.js', 'Express', 'MongoDB', 'API', 'Backend'],
    coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'Node.js Fundamentals',
          lectures: [
            {
              title: 'Introduction to Node.js',
              videoUrl: 'https://example.com/videos/nodejs-intro.mp4',
              durationSec: 2400,
              resources: [
                { title: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'NPM and Package Management',
              videoUrl: 'https://example.com/videos/nodejs-npm.mp4',
              durationSec: 1800,
              resources: [
                { title: 'NPM Guide', url: 'https://example.com/resources/npm-guide.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'Express.js Framework',
          lectures: [
            {
              title: 'Express Basics and Routing',
              videoUrl: 'https://example.com/videos/express-basics.mp4',
              durationSec: 2700,
              resources: [
                { title: 'Express Documentation', url: 'https://expressjs.com/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Middleware and Error Handling',
              videoUrl: 'https://example.com/videos/express-middleware.mp4',
              durationSec: 2100,
              resources: [
                { title: 'Express Middleware Guide', url: 'https://example.com/resources/express-middleware.pdf', type: 'pdf' }
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
    title: 'Machine Learning with Python',
    description: 'Learn machine learning algorithms, data preprocessing, model training, and evaluation using Python and scikit-learn.',
    category: 'Machine Learning',
    level: 'intermediate',
    language: 'English',
    price: 249,
    tags: ['Python', 'Machine Learning', 'Scikit-learn', 'Data Science', 'AI'],
    coverUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'ML Fundamentals',
          lectures: [
            {
              title: 'Introduction to Machine Learning',
              videoUrl: 'https://example.com/videos/ml-intro.mp4',
              durationSec: 3000,
              resources: [
                { title: 'ML Concepts Guide', url: 'https://example.com/resources/ml-concepts.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Data Preprocessing Techniques',
              videoUrl: 'https://example.com/videos/ml-preprocessing.mp4',
              durationSec: 2700,
              resources: [
                { title: 'Data Preprocessing Guide', url: 'https://example.com/resources/data-preprocessing.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'Supervised Learning',
          lectures: [
            {
              title: 'Linear and Logistic Regression',
              videoUrl: 'https://example.com/videos/ml-regression.mp4',
              durationSec: 2400,
              resources: [
                { title: 'Regression Algorithms', url: 'https://example.com/resources/regression-algorithms.pdf', type: 'pdf' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Decision Trees and Random Forest',
              videoUrl: 'https://example.com/videos/ml-trees.mp4',
              durationSec: 2100,
              resources: [
                { title: 'Tree Algorithms Guide', url: 'https://example.com/resources/tree-algorithms.pdf', type: 'pdf' }
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
    title: 'Docker and Containerization',
    description: 'Master Docker containerization, orchestration with Kubernetes, and modern DevOps practices.',
    category: 'DevOps',
    level: 'intermediate',
    language: 'English',
    price: 199,
    tags: ['Docker', 'Kubernetes', 'DevOps', 'Containers', 'CI/CD'],
    coverUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335a?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'Docker Fundamentals',
          lectures: [
            {
              title: 'Introduction to Docker',
              videoUrl: 'https://example.com/videos/docker-intro.mp4',
              durationSec: 2400,
              resources: [
                { title: 'Docker Documentation', url: 'https://docs.docker.com/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Dockerfile Best Practices',
              videoUrl: 'https://example.com/videos/docker-dockerfile.mp4',
              durationSec: 2100,
              resources: [
                { title: 'Dockerfile Guide', url: 'https://example.com/resources/dockerfile-guide.pdf', type: 'pdf' }
              ],
              order: 2,
              isPublished: true
            }
          ],
          order: 1,
          isPublished: true
        },
        {
          title: 'Docker Compose and Orchestration',
          lectures: [
            {
              title: 'Docker Compose Multi-Container Apps',
              videoUrl: 'https://example.com/videos/docker-compose.mp4',
              durationSec: 2700,
              resources: [
                { title: 'Docker Compose Reference', url: 'https://example.com/resources/docker-compose.pdf', type: 'pdf' }
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
    reviewCount: 0
  },
  {
    title: 'GraphQL API Development',
    description: 'Build modern APIs with GraphQL, Apollo Server, and React. Learn query optimization and real-time subscriptions.',
    category: 'API Development',
    level: 'intermediate',
    language: 'English',
    price: 169,
    tags: ['GraphQL', 'Apollo', 'API', 'React', 'Real-time'],
    coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop',
    structure: {
      sections: [
        {
          title: 'GraphQL Basics',
          lectures: [
            {
              title: 'Introduction to GraphQL',
              videoUrl: 'https://example.com/videos/graphql-intro.mp4',
              durationSec: 2400,
              resources: [
                { title: 'GraphQL Documentation', url: 'https://graphql.org/learn/', type: 'link' }
              ],
              order: 1,
              isPublished: true
            },
            {
              title: 'Schema Definition and Types',
              videoUrl: 'https://example.com/videos/graphql-schema.mp4',
              durationSec: 2100,
              resources: [
                { title: 'GraphQL Schema Guide', url: 'https://example.com/resources/graphql-schema.pdf', type: 'pdf' }
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
  }
];

// Additional products
const additionalProducts = [
  {
    name: 'Lifetime Access Pass',
    description: 'Get lifetime access to all current and future courses with premium support.',
    price: 999,
    category: 'Premium',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    stock: 100,
    isActive: true,
    features: [
      'Lifetime access to all courses',
      'Premium support',
      'Exclusive content',
      'Early access to new courses',
      'Certificate of completion'
    ]
  },
  {
    name: 'Career Coaching Package',
    description: 'Complete career coaching package including resume review, interview prep, and job search guidance.',
    price: 299,
    category: 'Service',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
    stock: 25,
    isActive: true,
    features: [
      'Resume optimization',
      'LinkedIn profile review',
      'Interview preparation',
      'Job search strategy',
      'Salary negotiation tips'
    ]
  },
  {
    name: 'Code Review Service',
    description: 'Professional code review service for your projects with detailed feedback and improvement suggestions.',
    price: 79,
    category: 'Service',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    stock: 50,
    isActive: true,
    features: [
      'Detailed code review',
      'Best practices suggestions',
      'Performance optimization tips',
      'Security recommendations',
      'Follow-up consultation'
    ]
  }
];

export const seedAdditionalData = async () => {
  try {
    console.log('🌱 Seeding additional comprehensive data...');

    // Hash passwords for all users
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 10);
    };

    // Get existing instructors
    const existingInstructors = await User.find({ role: UserRoles.INSTRUCTOR });
    
    // Create additional courses
    console.log('📚 Creating additional courses...');
    const createdCourses = [];
    for (let i = 0; i < additionalCourses.length; i++) {
      const courseData = additionalCourses[i];
      const instructor = existingInstructors[i % existingInstructors.length];
      
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (!existingCourse) {
        courseData.createdBy = instructor._id;
        courseData.assignedInstructor = instructor._id;
        const course = new Course(courseData);
        await course.save();
        createdCourses.push(course);
        console.log(`✅ Created additional course: ${course.title} (Instructor: ${instructor.profile.firstName})`);
      } else {
        createdCourses.push(existingCourse);
        console.log(`⏭️  Course already exists: ${existingCourse.title}`);
      }
    }

    // Create additional products
    console.log('🛍️ Creating additional products...');
    const createdProducts = [];
    for (const productData of additionalProducts) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        const product = new Product(productData);
        await product.save();
        createdProducts.push(product);
        console.log(`✅ Created additional product: ${product.name}`);
      } else {
        createdProducts.push(existingProduct);
        console.log(`⏭️  Product already exists: ${existingProduct.name}`);
      }
    }

    // Create more enrollments for additional courses
    console.log('🎯 Creating additional enrollments...');
    const existingStudents = await User.find({ role: UserRoles.STUDENT });
    
    for (const course of createdCourses) {
      const enrolledStudents = existingStudents.slice(0, Math.floor(Math.random() * 4) + 1); // 1-4 students per course
      
      for (const student of enrolledStudents) {
        const existingEnrollment = await Enrollment.findOne({ 
          studentId: student._id, 
          courseId: course._id 
        });
        
        if (!existingEnrollment) {
          const enrollment = new Enrollment({
            studentId: student._id,
            courseId: course._id,
            enrolledAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000), // Random date within last 15 days
            progress: Math.floor(Math.random() * 80) + 10, // 10-90% progress
            completedLessons: Math.floor(Math.random() * course.structure.sections.reduce((total, section) => total + section.lectures.length, 0)),
            status: Math.random() > 0.2 ? 'active' : 'completed'
          });
          await enrollment.save();
          console.log(`✅ Enrolled ${student.profile.firstName} in ${course.title}`);
        }
      }
    }

    // Create more assignments for additional courses
    console.log('📝 Creating additional assignments...');
    for (const course of createdCourses.slice(0, 3)) {
      const assignment = new Assignment({
        courseId: course._id,
        title: `${course.title} - Practical Exercise`,
        description: `Complete a hands-on exercise demonstrating your understanding of ${course.title.toLowerCase()}.`,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Due in 10 days
        maxScore: 100,
        instructions: 'Follow the provided guidelines and submit your work with a brief explanation of your approach.',
        status: 'active'
      });
      await assignment.save();
      console.log(`✅ Created additional assignment: ${assignment.title}`);
    }

    // Create more live sessions
    console.log('🎥 Creating additional live sessions...');
    for (const instructor of existingInstructors.slice(1, 4)) {
      const instructorCourses = await Course.find({ assignedInstructor: instructor._id });
      
      if (instructorCourses.length > 0) {
        const course = instructorCourses[Math.floor(Math.random() * instructorCourses.length)];
        const session = new LiveSession({
          instructorId: instructor._id,
          courseId: course._id,
          title: `${course.title} - Live Workshop`,
          description: 'Join us for an interactive live workshop where you can practice and get hands-on experience.',
          startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // In 5 days
          endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours duration
          status: 'scheduled',
          maxParticipants: 30,
          joinLink: `https://meet.example.com/workshop-${Math.random().toString(36).substr(2, 9)}`
        });
        await session.save();
        console.log(`✅ Created additional live session: ${session.title}`);
      }
    }

    // Create more reviews for additional courses
    console.log('⭐ Creating additional reviews...');
    for (const course of createdCourses.slice(0, 2)) {
      const courseEnrollments = await Enrollment.find({ courseId: course._id }).limit(2);
      
      for (const enrollment of courseEnrollments) {
        const student = await User.findById(enrollment.studentId);
        const review = new Review({
          userId: student._id,
          courseId: course._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: `Excellent course! The instructor provides clear explanations and practical examples. The course structure is well-organized and easy to follow.`,
          createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
        });
        await review.save();
        console.log(`✅ Created additional review by ${student.profile.firstName} for ${course.title}`);
      }
    }

    // Update course statistics
    console.log('📊 Updating course statistics...');
    const allCourses = await Course.find({});
    for (const course of allCourses) {
      const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
      const avgProgress = await Enrollment.aggregate([
        { $match: { courseId: course._id } },
        { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
      ]);
      
      course.enrollmentCount = enrollmentCount;
      course.avgProgressPct = avgProgress.length > 0 ? Math.round(avgProgress[0].avgProgress) : 0;
      
      // Update ratings
      const reviews = await Review.find({ courseId: course._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        course.rating = Math.round(avgRating * 10) / 10;
        course.reviewCount = reviews.length;
      }
      
      await course.save();
    }

    console.log('🎉 Additional data seeding completed successfully!');
    console.log(`📊 Additional Summary:`);
    console.log(`   📚 Additional Courses: ${createdCourses.length}`);
    console.log(`   🛍️ Additional Products: ${createdProducts.length}`);
    console.log(`   📝 Total Assignments: ${await Assignment.countDocuments()}`);
    console.log(`   🎥 Total Live Sessions: ${await LiveSession.countDocuments()}`);
    console.log(`   ⭐ Total Reviews: ${await Review.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error during additional data seeding:', error);
    throw error;
  }
};

export default seedAdditionalData;

import { Course, Enrollment, Product, User } from '../models/index.js';

export const generateCourseRecommendations = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.studentProfile) {
      return [];
    }
    
    const { interestType, domains, learningPace } = user.studentProfile;
    
    // Get already enrolled courses
    const enrollments = await Enrollment.find({ studentId: userId });
    const enrolledCourseIds = enrollments.map(e => e.courseId);
    
    // Find courses matching user interests
    const filter = {
      isPublished: true,
      _id: { $nin: enrolledCourseIds }
    };
    
    // Add domain-based filtering
    if (domains && domains.length > 0) {
      filter.tags = { $in: domains };
    }
    
    let courses = await Course.find(filter)
      .populate('assignedInstructor', 'username profile')
      .limit(6);
    
    // Score and sort recommendations
    const recommendations = courses.map(course => {
      let score = 0;
      
      // Domain match scoring
      if (domains) {
        const domainMatches = course.tags.filter(tag => domains.includes(tag)).length;
        score += domainMatches * 10;
      }
      
      // Learning pace consideration
      if (learningPace === 'intensive' && course.estimatedHours > 20) {
        score += 5;
      } else if (learningPace === 'slow' && course.estimatedHours <= 10) {
        score += 5;
      }
      
      // Popularity boost
      score += course.enrollmentCount * 0.1;
      
      // Rating boost
      score += course.rating.average * 2;
      
      return {
        course,
        score
      };
    });
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.course);
      
  } catch (error) {
    console.error('Error generating course recommendations:', error);
    return [];
  }
};

export const generateProductRecommendations = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.studentProfile) {
      return [];
    }
    
    const { domains } = user.studentProfile;
    
    // Get user's enrolled courses to understand their learning patterns
    const enrollments = await Enrollment.find({ studentId: userId })
      .populate('courseId', 'category tags');
    
    const courseTags = enrollments.flatMap(e => e.courseId?.tags || []);
    const courseCategories = enrollments.map(e => e.courseId?.category).filter(Boolean);
    
    // Product recommendation mapping
    const productMapping = {
      'webdev': ['headphones', 'monitor', 'keyboard', 'mouse'],
      'ai': ['headphones', 'graphics-card', 'notebook'],
      'datascience': ['headphones', 'notebook', 'stylus'],
      'mobile': ['stylus', 'tablet', 'phone-accessories'],
      'cybersecurity': ['hardware-security', 'books'],
      'devops': ['cloud-services', 'books']
    };
    
    let recommendedCategories = [];
    
    // Add categories based on user domains
    if (domains) {
      domains.forEach(domain => {
        if (productMapping[domain]) {
          recommendedCategories.push(...productMapping[domain]);
        }
      });
    }
    
    // Add general study accessories
    recommendedCategories.push('headphones', 'stylus', 'chargers', 'cables');
    
    // Remove duplicates
    recommendedCategories = [...new Set(recommendedCategories)];
    
    // Get products from recommended categories
    const products = await Product.find({
      isActive: true,
      category: { $in: recommendedCategories }
    })
    .sort({ rating: -1, createdAt: -1 })
    .limit(6);
    
    return products;
    
  } catch (error) {
    console.error('Error generating product recommendations:', error);
    return [];
  }
};

export const updateUserRecommendations = async (userId) => {
  try {
    const courseRecommendations = await generateCourseRecommendations(userId);
    const productRecommendations = await generateProductRecommendations(userId);
    
    // In a production app, you might want to cache these recommendations
    // in a separate collection or Redis for better performance
    
    return {
      courses: courseRecommendations,
      products: productRecommendations,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error updating recommendations:', error);
    return { courses: [], products: [], generatedAt: new Date() };
  }
};

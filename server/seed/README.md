# Slate LMS - Comprehensive Seed Data

This directory contains comprehensive seed data for the Slate Learning Management System. The seed data includes users, courses, materials, live sessions, products, and more to provide a fully functional demo environment.

## 🚀 Quick Start

To seed the database with all comprehensive data:

```bash
cd server
npm run seed
```

## 📊 What Gets Seeded

### 👥 Users
- **5 Instructors** with detailed profiles, expertise, and availability
- **8 Students** with different learning preferences and goals
- **1 Admin** user for system management

### 📚 Courses (11 Total)
1. **Complete Web Development Bootcamp** - Beginner web development
2. **React.js Complete Guide** - Intermediate React development
3. **Python for Data Science** - Beginner data science
4. **Mobile App Development with React Native** - Intermediate mobile development
5. **UI/UX Design Masterclass** - Beginner design
6. **AWS Cloud Architecture** - Advanced cloud computing
7. **JavaScript ES6+ Mastery** - Intermediate JavaScript
8. **Node.js Backend Development** - Intermediate backend
9. **Machine Learning with Python** - Intermediate ML
10. **Docker and Containerization** - Intermediate DevOps
11. **GraphQL API Development** - Intermediate API development

### 📖 Course Content
Each course includes:
- **Multiple sections** with organized lectures
- **Video content** with realistic durations
- **Learning resources** (PDFs, links, references)
- **Structured curriculum** from beginner to advanced topics

### 🎯 Enrollments
- **Realistic enrollment patterns** across courses
- **Progress tracking** with completion percentages
- **Enrollment dates** spread over the last 30 days

### 📝 Assignments
- **Course-specific assignments** for practical learning
- **Realistic due dates** and instructions
- **Varied difficulty levels** and requirements

### 🎥 Live Sessions
- **Scheduled live sessions** for interactive learning
- **Q&A sessions** and workshops
- **Realistic timing** and participant limits

### 🛍️ Products (7 Total)
1. **Premium Course Bundle** - $499
2. **1-on-1 Mentoring Session** - $150
3. **Project Portfolio Review** - $99
4. **Coding Bootcamp Prep** - $199
5. **Lifetime Access Pass** - $999
6. **Career Coaching Package** - $299
7. **Code Review Service** - $79

### 🛒 Orders
- **Sample orders** with realistic purchase patterns
- **Completed transactions** with payment status
- **Varied order dates** and amounts

### ⭐ Reviews
- **Course reviews** with ratings and comments
- **Realistic feedback** from students
- **Updated course ratings** based on reviews

### 📋 Audit Logs
- **System activity logs** for tracking
- **User actions** and system events
- **Realistic timestamps** and metadata

## 🔑 Login Credentials

### Admin
- **Email:** admin@slate.com
- **Password:** Admin@123456

### Instructors
- **Email:** john.doe@example.com
- **Password:** Instructor123!
- **Email:** sarah.wilson@example.com
- **Password:** Instructor123!
- **Email:** mike.chen@example.com
- **Password:** Instructor123!
- **Email:** emma.davis@example.com
- **Password:** Instructor123!
- **Email:** alex.rodriguez@example.com
- **Password:** Instructor123!

### Students
- **Email:** student1@example.com
- **Password:** Student123!
- **Email:** student2@example.com
- **Password:** Student123!
- **Email:** student3@example.com
- **Password:** Student123!
- **Email:** student4@example.com
- **Password:** Student123!
- **Email:** student5@example.com
- **Password:** Student123!
- **Email:** student6@example.com
- **Password:** Student123!
- **Email:** student7@example.com
- **Password:** Student123!
- **Email:** student8@example.com
- **Password:** Student123!

## 📁 File Structure

```
server/seed/
├── seedAdmin.js          # Admin user creation
├── seedRoles.js          # System roles and permissions
├── seedData.js           # Main comprehensive seed data
├── seedAdditionalData.js # Additional courses and products
└── runSeed.js           # Main seeding script
```

## 🎯 Features Demonstrated

### For Instructors
- **Course Creation** - Instructors can create and manage courses
- **Content Management** - Upload materials, create lectures
- **Live Sessions** - Schedule and conduct live classes
- **Student Tracking** - Monitor student progress and attendance
- **Assignment Management** - Create and grade assignments
- **Analytics** - View teaching insights and course performance

### For Students
- **Course Discovery** - Browse and enroll in courses
- **Learning Progress** - Track completion and progress
- **Live Participation** - Join live sessions and workshops
- **Assignment Submission** - Complete and submit assignments
- **Reviews** - Rate and review courses
- **Store Access** - Purchase additional products and services

### For Admins
- **User Management** - Manage instructors and students
- **Course Oversight** - Monitor all courses and content
- **Analytics Dashboard** - View system-wide statistics
- **Order Management** - Process orders and payments
- **Audit Logs** - Track system activity and user actions

## 🔄 Re-seeding

To clear and re-seed the database:

```bash
# Clear existing data (optional)
npm run clear-db

# Re-seed with fresh data
npm run seed
```

## 📈 Data Statistics

After seeding, you'll have:
- **14 Total Users** (1 admin, 5 instructors, 8 students)
- **11 Comprehensive Courses** with full content structure
- **25+ Enrollments** with realistic progress tracking
- **15+ Assignments** across different courses
- **10+ Live Sessions** scheduled for interactive learning
- **7 Products** in the store with varied pricing
- **10+ Orders** with completed transactions
- **15+ Reviews** with ratings and feedback
- **20+ Audit Logs** for system tracking

## 🎨 Realistic Data

All seed data is designed to be:
- **Realistic** - Uses actual course titles, descriptions, and content
- **Comprehensive** - Covers multiple domains and skill levels
- **Interactive** - Includes relationships between users, courses, and content
- **Functional** - All data works seamlessly with the application features
- **Scalable** - Easy to extend with additional data as needed

## 🚀 Next Steps

After seeding:
1. **Login as different users** to explore features
2. **Create additional courses** as an instructor
3. **Enroll in courses** as a student
4. **Test live sessions** and assignments
5. **Explore the admin dashboard** for system management
6. **Purchase products** from the store
7. **Leave reviews** and ratings

The seed data provides a complete, functional demo environment that showcases all features of the Slate LMS platform.

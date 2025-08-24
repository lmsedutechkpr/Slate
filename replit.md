# Overview

EduTech LMS is a comprehensive learning management system that combines educational content delivery with e-commerce functionality for mobile accessories. The application is designed as a SaaS platform featuring role-based access control (Admin, Instructor, Student), course management, assignment tracking, live sessions, and an integrated store for mobile accessories. The system includes modern features like progress tracking, gamification elements (XP, badges, streaks), offline capabilities, and multilingual support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, utilizing Vite as the build tool for fast development and optimized production builds. The application follows a component-based architecture with:

- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Animations**: Framer Motion for smooth UI transitions and micro-interactions

## Backend Architecture
The backend implements a hybrid approach supporting both MongoDB (legacy) and PostgreSQL (modern) data layers:

- **Framework**: Express.js with TypeScript for type safety and modern JavaScript features
- **Database Layer**: Dual support with Drizzle ORM for PostgreSQL and Mongoose for MongoDB
- **Authentication**: JWT-based authentication with access/refresh token rotation
- **File Storage**: Cloudinary integration for media uploads and management
- **API Design**: RESTful API structure with role-based access control middleware

## Authentication & Authorization
The system implements a strict role-based authentication model:

- **Student Registration**: Open self-registration with onboarding flow
- **Admin Access**: Pre-seeded admin account (no registration endpoint)
- **Instructor Provisioning**: Admin-created accounts with optional Google OAuth linking
- **Session Management**: JWT tokens with bcrypt password hashing
- **Role Routing**: Automatic redirection based on user role after authentication

## Data Architecture
The application supports a transitional data architecture:

- **PostgreSQL**: Primary database using Drizzle ORM for new features and type safety
- **MongoDB**: Legacy support with Mongoose models for existing functionality
- **Schema Validation**: Drizzle-Zod integration for runtime type checking
- **Migrations**: Database versioning through Drizzle Kit

## PWA & Offline Capabilities
The system is designed as a Progressive Web App with offline-first features:

- **Service Worker**: Background sync for critical operations
- **Caching Strategy**: IndexedDB for course content and progress tracking
- **Offline Orders**: Queue system for e-commerce transactions when offline
- **Data Synchronization**: Automatic sync when connectivity is restored

## Scalability Considerations
The architecture supports horizontal scaling through:

- **Stateless Backend**: JWT-based authentication eliminates server-side session storage
- **Database Flexibility**: Support for both SQL and NoSQL databases based on use case
- **CDN Integration**: Cloudinary for global media delivery
- **Modular Frontend**: Component-based architecture for team scalability

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting with serverless capabilities for modern features
- **MongoDB**: Document database for legacy data and flexible content storage

## Authentication & Security
- **Google OAuth**: Optional authentication integration for instructor accounts
- **JWT**: JSON Web Tokens for stateless authentication
- **bcrypt**: Password hashing for secure credential storage

## Media & File Management
- **Cloudinary**: Cloud-based media storage, transformation, and CDN delivery
- **Multer**: Express middleware for handling multipart/form-data file uploads

## Payment Processing
- **Stripe/Razorpay**: Payment gateway integration for e-commerce transactions
- **Cash on Delivery**: Offline payment option support

## External Content Integration
- **YouTube API**: Video lecture embedding and playlist management
- **Google Meet/Zoom**: External video conferencing platform integration for live sessions

## Development & Deployment
- **Vite**: Frontend build tool with hot module replacement
- **Replit**: Development environment with integrated deployment capabilities
- **TypeScript**: Type safety across the entire application stack

## UI & Design System
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent visual elements
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation and type inference

## Additional Libraries
- **TanStack Query**: Server state management and caching
- **Framer Motion**: Animation library for smooth transitions
- **date-fns**: Date manipulation and formatting utilities
- **Socket.IO**: Real-time communication for notifications and live features
- **i18next**: Internationalization for English and Tamil language support
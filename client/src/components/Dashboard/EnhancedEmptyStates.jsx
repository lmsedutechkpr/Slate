import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Video, 
  BookOpen, 
  ArrowRight,
  Plus,
  Users,
  Clock
} from 'lucide-react';

export const EmptyAssignments = () => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Calendar className="w-8 h-8 text-green-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
    <p className="text-gray-600 mb-4">No upcoming assignments. You're doing great!</p>
    <div className="space-y-2">
      <Link href="/courses">
        <Button className="w-full">
          <BookOpen className="w-4 h-4 mr-2" />
          Go to My Courses
        </Button>
      </Link>
      <Link href="/assignments">
        <Button variant="outline" className="w-full">
          <Clock className="w-4 h-4 mr-2" />
          Plan Your Study Week
        </Button>
      </Link>
    </div>
  </div>
);

export const EmptyLiveSessions = () => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Video className="w-8 h-8 text-purple-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No live sessions scheduled</h3>
    <p className="text-gray-600 mb-4">Check back later for interactive learning sessions</p>
    <div className="space-y-2">
      <Link href="/courses">
        <Button className="w-full">
          <BookOpen className="w-4 h-4 mr-2" />
          Browse Courses with Live Sessions
        </Button>
      </Link>
      <Link href="/live-sessions">
        <Button variant="outline" className="w-full">
          <Users className="w-4 h-4 mr-2" />
          View All Sessions
        </Button>
      </Link>
    </div>
  </div>
);

export const EmptyCourses = () => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <BookOpen className="w-8 h-8 text-blue-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Start your learning journey</h3>
    <p className="text-gray-600 mb-4">Enroll in courses to begin your educational adventure</p>
    <div className="space-y-2">
      <Link href="/courses">
        <Button className="w-full">
          <BookOpen className="w-4 h-4 mr-2" />
          Browse All Courses
        </Button>
      </Link>
      <Link href="/courses?featured=true">
        <Button variant="outline" className="w-full">
          <ArrowRight className="w-4 h-4 mr-2" />
          View Featured Courses
        </Button>
      </Link>
    </div>
  </div>
);

export const EmptyRecommendations = () => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <ArrowRight className="w-8 h-8 text-amber-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
    <p className="text-gray-600 mb-4">Complete a course to get personalized suggestions</p>
    <div className="space-y-2">
      <Link href="/courses">
        <Button className="w-full">
          <BookOpen className="w-4 h-4 mr-2" />
          Start Learning
        </Button>
      </Link>
      <Link href="/store">
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Browse Store
        </Button>
      </Link>
    </div>
  </div>
);

export const EmptyProducts = () => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Plus className="w-8 h-8 text-green-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
    <p className="text-gray-600 mb-4">Check back later for recommended learning tools</p>
    <div className="space-y-2">
      <Link href="/store">
        <Button className="w-full">
          <ArrowRight className="w-4 h-4 mr-2" />
          Visit Store
        </Button>
      </Link>
    </div>
  </div>
);

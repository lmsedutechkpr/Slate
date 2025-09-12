import { Card, CardContent, CardHeader } from '@/components/ui/card';

const CourseCardSkeleton = () => {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-20 h-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm mb-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-14"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
        </div>
        
        <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCardSkeleton;

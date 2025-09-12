import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribe } from '@/lib/socket.js';

export const useRealtimeCourseUpdates = () => {
  const queryClient = useQueryClient();
  const [liveUpdates, setLiveUpdates] = useState({});

  useEffect(() => {
    let unsubs = [];

    const setupRealtimeUpdates = async () => {
      // Listen for course enrollment updates
      const unsubEnrolled = await subscribe('course:enrolled', (data) => {
        const { courseId, enrollmentCount } = data;
        
        // Update the specific course's enrollment count
        queryClient.setQueryData(['/api/courses'], (oldData) => {
          if (!oldData?.courses) return oldData;
          
          return {
            ...oldData,
            courses: oldData.courses.map(course => 
              course._id === courseId 
                ? { ...course, enrollmentCount: enrollmentCount }
                : course
            )
          };
        });

        // Show live update indicator
        setLiveUpdates(prev => ({
          ...prev,
          [courseId]: {
            type: 'enrollment',
            count: enrollmentCount,
            timestamp: Date.now()
          }
        }));

        // Clear the indicator after 3 seconds
        setTimeout(() => {
          setLiveUpdates(prev => {
            const newUpdates = { ...prev };
            delete newUpdates[courseId];
            return newUpdates;
          });
        }, 3000);
      });
      unsubs.push(unsubEnrolled);

      // Listen for course review updates
      const unsubReviewed = await subscribe('course:reviewed', (data) => {
        const { courseId, averageRating, reviewCount } = data;
        
        // Update the specific course's rating data
        queryClient.setQueryData(['/api/courses'], (oldData) => {
          if (!oldData?.courses) return oldData;
          
          return {
            ...oldData,
            courses: oldData.courses.map(course => 
              course._id === courseId 
                ? { 
                    ...course, 
                    rating: { 
                      average: averageRating, 
                      count: reviewCount 
                    } 
                  }
                : course
            )
          };
        });

        // Show live update indicator
        setLiveUpdates(prev => ({
          ...prev,
          [courseId]: {
            type: 'review',
            rating: averageRating,
            count: reviewCount,
            timestamp: Date.now()
          }
        }));

        // Clear the indicator after 3 seconds
        setTimeout(() => {
          setLiveUpdates(prev => {
            const newUpdates = { ...prev };
            delete newUpdates[courseId];
            return newUpdates;
          });
        }, 3000);
      });
      unsubs.push(unsubReviewed);

      // Listen for trending course updates
      const unsubTrending = await subscribe('course:trending', (data) => {
        const { courseId, isTrending } = data;
        
        // Update the specific course's trending status
        queryClient.setQueryData(['/api/courses'], (oldData) => {
          if (!oldData?.courses) return oldData;
          
          return {
            ...oldData,
            courses: oldData.courses.map(course => 
              course._id === courseId 
                ? { ...course, isTrending }
                : course
            )
          };
        });
      });
      unsubs.push(unsubTrending);
    };

    setupRealtimeUpdates();

    return () => {
      unsubs.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, [queryClient]);

  return { liveUpdates };
};

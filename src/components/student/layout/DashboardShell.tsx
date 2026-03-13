'use client';

import { usePathname } from 'next/navigation';
import StudentSidebar from '@/components/student/StudentSidebar';
import StudentTopbar from '@/components/student/StudentTopbar';
import GlobalCartDrawer from '@/components/student/shop/GlobalCartDrawer';

export default function DashboardShell({ 
  children, 
  profile 
}: { 
  children: React.ReactNode; 
  profile: any;
}) {
  const pathname = usePathname();
  
  // Conditionally hide the global Dashboard shell if the user is in the Course Player
  // The Course Player route is exactly /student/courses/[UUID]
  // We exclude /student/courses/browse[...] which needs the dashboard shell
  const isCoursePlayerRoute = pathname.match(/^\/student\/courses\/[a-f0-9-]+$/i);

  if (isCoursePlayerRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50">
        <StudentSidebar serverProfile={profile} />
      </div>

      <div className="flex flex-1 flex-col transition-all duration-300 lg:ml-[240px]">
        {/* Top Navigation */}
        <StudentTopbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 pt-[52px]">
          <div className={`w-full min-h-[calc(100vh-52px)] flex flex-col ${pathname === '/student/messages' ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Global Cart Drawer — always in DOM, self-fetches its cart data */}
      <GlobalCartDrawer userId={profile.id} />
    </div>
  );
}

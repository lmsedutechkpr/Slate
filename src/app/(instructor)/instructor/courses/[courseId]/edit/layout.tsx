// Full-screen layout override for the course editor — no sidebar/topbar
export default function CourseEditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      {children}
    </div>
  );
}

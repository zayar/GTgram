export default function EmbeddedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white w-full overflow-x-hidden">
      {/* Main content without any navigation */}
      <main className="flex-1 w-full min-w-0 p-2 sm:p-4 max-w-4xl mx-auto">
        {/* Page content */}
        {children}
      </main>
    </div>
  );
} 
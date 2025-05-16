export default function EmbeddedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Main content without any navigation */}
      <main className="flex-1 p-4">
        {/* Page content */}
        {children}
      </main>
    </div>
  );
} 
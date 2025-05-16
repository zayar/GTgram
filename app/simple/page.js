import SimpleFeed from '@/components/simple/SimpleFeed';

export default function SimplePage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <header className="border-b border-gray-800 p-4 flex justify-center">
        <h1 className="text-2xl font-bold">GTgram Simple</h1>
      </header>
      
      <main>
        <SimpleFeed />
      </main>
    </div>
  );
} 
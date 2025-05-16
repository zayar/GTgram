'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  AiFillHome, 
  AiOutlineSearch, 
  AiOutlineCompass, 
  AiOutlineVideoCamera, 
  AiOutlineMessage, 
  AiOutlineHeart, 
  AiOutlinePlusCircle, 
  AiOutlineUser, 
  AiOutlineMenu 
} from 'react-icons/ai';
import { useState, useEffect } from 'react';
import placeholders from '@/lib/placeholders';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string>('');

  useEffect(() => {
    // Set the avatar source only after component mounts
    // This prevents hydration mismatch and ensures placeholder is ready
    if (user?.photoURL && !imageError) {
      setAvatarSrc(user.photoURL);
    } else {
      setAvatarSrc(placeholders.avatar);
    }
  }, [user, imageError]);

  if (!user) return null;

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigate directly to the page in the (main) route group
    router.push('/create-post');
  };

  const navItems = [
    { icon: <AiFillHome className="text-gtgram-green" size={24} />, text: 'Home', path: '/home' },
    { icon: <AiOutlineSearch className="text-gtgram-green" size={24} />, text: 'Search', path: '/search' },
    { icon: <AiOutlineCompass className="text-gtgram-green" size={24} />, text: 'Explore', path: '/explore' },
    { icon: <AiOutlineVideoCamera className="text-gtgram-green" size={24} />, text: 'Reels', path: '/reels' },
    { icon: <AiOutlineMessage className="text-gtgram-green" size={24} />, text: 'Messages', path: '/messages' },
    { icon: <AiOutlineHeart className="text-gtgram-green" size={24} />, text: 'Notifications', path: '/notifications' },
    { 
      icon: <AiOutlinePlusCircle className="text-gtgram-green" size={24} />, 
      text: 'Create', 
      path: '/create-post',
      onClick: handleCreateClick
    },
    { 
      icon: avatarSrc ? (
        <div className="w-6 h-6 rounded-full bg-gtgram-gray overflow-hidden">
          <Image 
            src={avatarSrc} 
            alt="Profile" 
            width={24} 
            height={24} 
            priority
            className="rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <AiOutlineUser className="text-gtgram-green" size={24} />
      ), 
      text: 'Profile', 
      path: `/profile/${user.uid}` 
    },
  ];

  const isActive = (path: string) => {
    if (path === '/create' && pathname.includes('/create')) {
      return true;
    }
    if (path.startsWith('/profile/') && pathname.startsWith('/profile/')) {
      return true;
    }
    return pathname === path;
  };

  return (
    <aside className="hidden md:block fixed left-0 top-0 h-full w-64 border-r border-gtgram-gray bg-white z-10">
      <div className="p-6">
        <Link href="/home" className="block mb-10">
          <h1 className="text-2xl font-cursive font-bold text-gtgram-green">GTgram</h1>
        </Link>
        
        <nav>
          <ul className="space-y-4">
            {navItems.map((item, index) => {
              const active = isActive(item.path);
              
              // Use a button for items with onClick handlers
              if (item.onClick) {
                return (
                  <li key={index}>
                    <button 
                      onClick={item.onClick}
                      className={`flex items-center w-full text-left space-x-4 p-3 rounded-lg transition-colors hover:bg-gtgram-green hover:bg-opacity-10 text-gtgram-dark ${
                        active ? 'font-bold bg-gtgram-green bg-opacity-5' : ''
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </button>
                  </li>
                );
              }
              
              // Use a simpler approach for the Profile link
              if (item.text === 'Profile') {
                return (
                  <li key={index}>
                    <Link 
                      href={`/profile/${user.uid}`}
                      className={`flex items-center space-x-4 p-3 rounded-lg transition-colors hover:bg-gtgram-green hover:bg-opacity-10 text-gtgram-dark ${
                        pathname.startsWith('/profile/') ? 'font-bold bg-gtgram-green bg-opacity-5' : ''
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </Link>
                  </li>
                );
              }
              
              // For all other links
              return (
                <li key={index}>
                  <Link 
                    href={item.path}
                    className={`flex items-center space-x-4 p-3 rounded-lg transition-colors hover:bg-gtgram-green hover:bg-opacity-10 text-gtgram-dark ${
                      active ? 'font-bold bg-gtgram-green bg-opacity-5' : ''
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-6 left-6">
          <Link 
            href="#"
            className="flex items-center space-x-4 p-3 rounded-lg transition-colors hover:bg-gtgram-green hover:bg-opacity-10 text-gtgram-dark"
          >
            <AiOutlineMenu className="text-gtgram-green" size={24} />
            <span>More</span>
          </Link>
        </div>
      </div>
    </aside>
  );
} 
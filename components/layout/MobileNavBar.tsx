'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  AiFillHome, 
  AiOutlineHome,
  AiOutlineSearch,
  AiOutlinePlusCircle,
  AiOutlineHeart, 
  AiFillHeart
} from 'react-icons/ai';
import { RiVideoLine, RiVideoFill } from 'react-icons/ri';
import { useState, useEffect, useCallback, memo } from 'react';
import UserAvatar from '@/components/ui/UserAvatar';

// Default inline avatar as base64 - guaranteed to work
const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0UwRTBFMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPlVzZXI8L3RleHQ+PC9zdmc+";

function MobileNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if path is active - memoize this function
  const isActive = useCallback((path: string) => {
    return pathname === path;
  }, [pathname]);

  // Navigate to user profile or login page - memoize this handler
  const handleProfileClick = useCallback(() => {
    if (user) {
      router.push(`/profile/${user.uid}`);
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gtgram-gray z-50 px-2 md:hidden">
      <div className="flex justify-between items-center h-14">
        {/* Home */}
        <Link href="/" className="flex-1 flex justify-center items-center">
          {isActive('/') ? (
            <AiFillHome size={26} className="text-gtgram-green" />
          ) : (
            <AiOutlineHome size={26} />
          )}
        </Link>

        {/* Search/Explore */}
        <Link href="/explore" className="flex-1 flex justify-center items-center">
          <AiOutlineSearch size={26} className={isActive('/explore') ? 'text-gtgram-green' : ''} />
        </Link>

        {/* Create Post */}
        <Link href="/create-post" className="flex-1 flex justify-center items-center">
          <AiOutlinePlusCircle size={28} className={isActive('/create-post') ? 'text-gtgram-green' : ''} />
        </Link>

        {/* Shop */}
        <Link href="/shop" className="flex-1 flex justify-center items-center">
          {isActive('/shop') ? (
            <RiVideoFill size={26} className="text-gtgram-green" />
          ) : (
            <RiVideoLine size={26} />
          )}
        </Link>

        {/* Profile */}
        <button 
          onClick={handleProfileClick}
          className="flex-1 flex justify-center items-center focus:outline-none"
        >
          <div
            className={`relative ${
              pathname.startsWith('/profile') ? 'scale-110' : 'scale-100'
            }`}
          >
            <UserAvatar 
              src={user?.photoURL}
              alt="Profile"
              size={28}
              border={pathname.startsWith('/profile')}
              borderColor="border-gtgram-green"
            />
          </div>
        </button>
      </div>
    </div>
  );
}

// Memoize the entire component
export default memo(MobileNavBar); 
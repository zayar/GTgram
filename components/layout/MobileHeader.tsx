'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AiFillHeart, AiOutlineHeart, AiOutlineMessage } from 'react-icons/ai';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MobileHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Only show header on specific routes
  if (pathname.startsWith('/profile/') || pathname === '/explore' || pathname === '/create-post') {
    return null;
  }

  return (
    <div className="md:hidden flex justify-between items-center py-3 px-2 border-b border-gtgram-gray mb-4">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <h1 className="text-2xl font-dancing-script font-bold">GTgram</h1>
      </Link>

      {/* Action buttons */}
      <div className="flex items-center space-x-4">
        {/* Notifications/likes */}
        <Link href="/notifications">
          <AiOutlineHeart size={24} />
        </Link>
        
        {/* Messages */}
        <Link href="/messages">
          <AiOutlineMessage size={24} />
        </Link>
      </div>
    </div>
  );
} 
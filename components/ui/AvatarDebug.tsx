'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import UserAvatar from './UserAvatar';

export default function AvatarDebug() {
  const { user } = useAuth();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 bg-white p-4 border rounded shadow-lg z-50 text-xs">
      <h3 className="font-bold">Avatar Debug</h3>
      <div>User: {user ? 'Logged In' : 'Not Logged In'}</div>
      <div>UID: {user?.uid || 'N/A'}</div>
      <div>PhotoURL: {user?.photoURL || 'None'}</div>
      
      <div className="mt-2">
        <p>Avatar Display:</p>
        <div className="flex items-center space-x-2 mt-1">
          <UserAvatar src={user?.photoURL} size={24} />
          <UserAvatar src={user?.photoURL} size={32} />
          <UserAvatar src={user?.photoURL} size={40} />
        </div>
      </div>
      
      <button 
        onClick={() => console.log('Full user object:', user)} 
        className="mt-2 bg-gray-200 px-2 py-1 rounded text-xs"
      >
        Log User Object
      </button>
    </div>
  );
} 
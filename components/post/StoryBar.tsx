'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, limit, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types/user';
import { useAuth } from '@/components/auth/AuthProvider';
import { AiOutlinePlus } from 'react-icons/ai';

interface StoryUser {
  id: string;
  username: string;
  avatar: string;
  hasNewStory: boolean;
}

export default function StoryBar() {
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [hasBluemarkStatus, setHasBluemarkStatus] = useState(false);

  useEffect(() => {
    const checkUserBluemark = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setHasBluemarkStatus(!!userData.bluemark);
        }
      } catch (error) {
        console.error('Error checking bluemark status:', error);
      }
    };
    
    checkUserBluemark();
  }, [currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Query users collection, limit to 10 users
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('username'),
          limit(10)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          let users = usersSnapshot.docs.map(doc => {
            const userData = doc.data() as User;
            
            // For now, randomly determine if user has a story
            // In a real app, you would check if the user has posted a story in the last 24 hours
            const hasNewStory = Math.random() > 0.5;
            
            return {
              id: doc.id,
              username: userData.username || 'user',
              avatar: userData.photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0UwRTBFMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPlVzZXI8L3RleHQ+PC9zdmc+',
              hasNewStory
            };
          });
          
          // If current user exists, move them to the beginning of the array
          if (currentUser) {
            // Find the current user in the array
            const currentUserIndex = users.findIndex(user => user.id === currentUser.uid);
            
            // If current user is in the array, move them to the beginning
            if (currentUserIndex !== -1) {
              const currentUserStory = users[currentUserIndex];
              users.splice(currentUserIndex, 1); // Remove from current position
              users.unshift(currentUserStory); // Add to beginning
            }
          }
          
          setStoryUsers(users);
        }
      } catch (error) {
        console.error('Error fetching users for story bar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentUser]);

  if (loading) {
    // Show placeholder loaders while loading
    return (
      <div className="mb-6 pb-2 border-b border-gtgram-gray">
        <div className="flex overflow-x-auto scrollbar-none space-x-4 p-2">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gtgram-gray animate-pulse"></div>
              <div className="h-3 w-12 bg-gtgram-gray rounded-full mt-2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (storyUsers.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 pb-2 border-b border-gtgram-gray bg-white">
      <div className="flex overflow-x-auto scrollbar-none space-x-4 p-2">
        {/* New Post Button for bluemark users */}
        {hasBluemarkStatus && (
          <Link href="/create-post" className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-gtgram-gray flex items-center justify-center bg-white">
              <AiOutlinePlus size={24} className="text-gtgram-green" />
            </div>
            <span className="text-xs mt-1 text-center text-gtgram-dark">New</span>
          </Link>
        )}
        
        {storyUsers.map((user, index) => (
          <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full p-[2px] ${user.hasNewStory ? 'bg-gradient-to-tr from-gtgram-green to-gtgram-light-green' : 'bg-gtgram-gray'}`}>
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                <Image 
                  src={user.avatar} 
                  alt={user.username} 
                  width={60} 
                  height={60}
                  priority={index < 3}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <span className="text-xs mt-1 truncate w-16 text-center text-gtgram-dark">{user.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
} 
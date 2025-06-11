'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import PostGrid from '@/components/post/PostGrid';
import { User } from '@/types/user';
import { Post } from '@/types/post';
import { 
  AiOutlineSetting, 
  AiOutlinePlus, 
  AiOutlineLogout,
  AiOutlineTable,
  AiOutlinePlaySquare, 
  AiOutlineHeart,
  AiOutlineUser,
  AiOutlineShop,
  AiOutlineCamera
} from 'react-icons/ai';
import { BsBookmark, BsGrid3X3, BsPlayBtn } from 'react-icons/bs';
import { FaShopify } from 'react-icons/fa';
import { FiTag } from 'react-icons/fi';
import placeholders from '@/lib/placeholders';
import BlueMark from '@/components/ui/BlueMark';
import { useUserProfile, usePosts, useSavedPosts } from '@/lib/hooks/useFirebaseQuery';
import { IoArrowBack } from 'react-icons/io5';

export default function ProfilePage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [activeTab, setActiveTab] = useState('posts');
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.uid === id;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Using React Query hooks for data fetching with automatic caching
  const { 
    data: user, 
    isLoading: isUserLoading,
    error: userError
  } = useUserProfile(id);

  const {
    data: posts = [],
    isLoading: isPostsLoading,
    error: postsError,
    refetch: refetchPosts
  } = usePosts(id, {
    // Handle posts that might not have createdAt field
    onError: (error: any) => {
      console.error('Error fetching posts with ordering:', error);
    },
    retry: 2, // Add automatic retry on failure
    retryDelay: 1000 // 1 second delay between retries
  });

  // Debug function to manually retry post fetching
  const handleRetryFetch = () => {
    setRetryCount(prev => prev + 1);
    refetchPosts();
  };

  useEffect(() => {
    // Log post data for debugging
    if (posts && posts.length > 0) {
      console.log(`Fetched ${posts.length} posts for user ${id}`);
      console.log('First post sample:', JSON.stringify(posts[0], null, 2));
    } else if (!isPostsLoading) {
      console.log(`No posts found for user ${id}`);
    }
  }, [posts, id, isPostsLoading]);

  // Get saved posts IDs from user data for own profile
  const savedPostIds = isOwnProfile && currentUser ? 
    (user?.savedPosts as string[] || []) : [];

  const {
    data: savedPosts = [],
    isLoading: isSavedPostsLoading
  } = useSavedPosts(savedPostIds, {
    enabled: isOwnProfile && savedPostIds.length > 0
  });

  // Set follow state and counts when user data loads
  useEffect(() => {
    if (user) {
      setFollowerCount(user.followers?.length || 0);
      setFollowingCount(user.following?.length || 0);

      // Check if current user is following this profile
      if (currentUser) {
        const followers = user.followers || [];
        setIsFollowing(Array.isArray(followers) && followers.includes(currentUser.uid));
      }
    }
  }, [user, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !user) return;
    
    try {
      const profileUserRef = doc(db, 'users', id);
      const currentUserRef = doc(db, 'users', currentUser.uid);
      
      if (isFollowing) {
        // Unfollow
        await updateDoc(profileUserRef, {
          followers: arrayRemove(currentUser.uid)
        });
        
        await updateDoc(currentUserRef, {
          following: arrayRemove(id)
        });
        
        setFollowerCount(followerCount - 1);
      } else {
        // Follow
        await updateDoc(profileUserRef, {
          followers: arrayUnion(currentUser.uid)
        });
        
        await updateDoc(currentUserRef, {
          following: arrayUnion(id)
        });
        
        setFollowerCount(followerCount + 1);
      }
      
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Determine if data is still loading
  const isLoading = isUserLoading || isPostsLoading || 
    (isOwnProfile && activeTab === 'saved' && isSavedPostsLoading);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green"></div>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 px-4 py-8 border-b border-gtgram-gray">
              {/* Profile Picture */}
              <div className="relative w-20 h-20 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden flex-shrink-0">
                <Image 
                  src={user?.photoURL || placeholders.avatar} 
                  alt={user?.username || 'User'} 
                  fill
                  sizes="(max-width: 640px) 5rem, (max-width: 768px) 9rem, 10rem"
                  priority
                  className="object-cover"
                />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                {/* Username and Buttons */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Link href="/home" className="text-xl md:text-2xl font-light mr-4">
                        <IoArrowBack />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-light">{user?.username}</h1>
                    {user?.bluemark && <BlueMark size={20} />}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                    {isOwnProfile ? (
                      <>
                        <button 
                          onClick={() => router.push(`/profile/edit/${user?.uid}`)}
                          className="bg-white hover:bg-gtgram-green hover:bg-opacity-10 text-gtgram-dark text-sm px-4 py-1.5 rounded font-medium border border-gtgram-gray"
                        >
                          Edit profile
                        </button>
                        <button 
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded font-medium flex items-center gap-1"
                        >
                          <AiOutlineLogout size={16} />
                          {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                      </>
                    ) :
                      <button 
                        onClick={handleFollow}
                        className={`px-6 py-1.5 rounded text-sm font-semibold ${
                          isFollowing 
                            ? 'bg-white text-gtgram-dark border border-gtgram-gray hover:bg-gtgram-green hover:bg-opacity-10' 
                            : 'bg-gtgram-green hover:bg-gtgram-light-green text-white'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    }
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex gap-6 md:gap-10 mb-4 text-sm justify-center md:justify-start">
                  <div className="flex flex-col items-center md:items-start">
                    <span className="font-semibold">{posts.length}</span>
                    <span className="text-gray-500">posts</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start">
                    <span className="font-semibold">{followerCount}</span>
                    <span className="text-gray-500">followers</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start">
                    <span className="font-semibold">{followingCount}</span>
                    <span className="text-gray-500">following</span>
                  </div>
                </div>
                
                {/* Bio */}
                <div className="text-center md:text-left">
                  <h2 className="font-semibold">{user?.fullName}</h2>
                  <p className="text-sm whitespace-pre-wrap">{user?.bio}</p>
                  {user?.website && (
                    <a 
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-blue-900 font-medium text-sm"
                    >
                      {user.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* New Post Button (visible only for own profile with bluemark) */}
            {isOwnProfile && user?.bluemark && (
              <div className="flex justify-center my-6">
                <Link 
                  href="/create-post"
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full border border-gtgram-gray flex items-center justify-center mb-1 hover:bg-gtgram-green hover:border-gtgram-green hover:text-white transition-colors">
                    <AiOutlinePlus size={24} />
                  </div>
                  <span className="text-xs font-medium">New</span>
                </Link>
              </div>
            )}
            
            {/* Debug Tools - Only visible in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="border-t border-b border-gtgram-gray py-2 px-4 my-2">
                <button 
                  onClick={() => setDebugMode(!debugMode)}
                  className="text-xs text-gtgram-green underline"
                >
                  {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
                </button>
                
                {debugMode && (
                  <div className="mt-2 text-xs overflow-auto">
                    <div className="mb-2">
                      <p>User ID: {id}</p>
                      <p>Posts count: {posts?.length || 0}</p>
                      <p>Retry count: {retryCount}</p>
                      {postsError && (
                        <p className="text-red-500">Error: {String(postsError)}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleRetryFetch}
                      className="bg-gtgram-green text-white px-2 py-1 rounded text-xs"
                    >
                      Retry Fetch Posts
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Tabs */}
            <div className="border-t border-gtgram-gray">
              <div className="flex justify-center">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center px-4 py-4 border-t-2 transition-colors ${
                    activeTab === 'posts' 
                      ? 'border-gtgram-green text-gtgram-dark' 
                      : 'border-transparent text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <BsGrid3X3 className="mr-2" size={12} />
                  <span className="text-xs uppercase font-semibold tracking-wider">Posts</span>
                </button>
                
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center px-4 py-4 border-t-2 transition-colors ${
                      activeTab === 'saved' 
                        ? 'border-gtgram-green text-gtgram-dark' 
                        : 'border-transparent text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    <BsBookmark className="mr-2" size={12} />
                    <span className="text-xs uppercase font-semibold tracking-wider">Saved</span>
                  </button>
                )}
                
                <button
                  onClick={() => setActiveTab('tagged')}
                  className={`flex items-center px-4 py-4 border-t-2 transition-colors ${
                    activeTab === 'tagged' 
                      ? 'border-gtgram-green text-gtgram-dark' 
                      : 'border-transparent text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <FiTag className="mr-2" size={12} />
                  <span className="text-xs uppercase font-semibold tracking-wider">Tagged</span>
                </button>
                
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab('shop')}
                    className={`hidden sm:flex items-center px-4 py-4 border-t-2 transition-colors ${
                      activeTab === 'shop' 
                        ? 'border-gtgram-green text-gtgram-dark' 
                        : 'border-transparent text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    <FaShopify className="mr-2" size={12} />
                    <span className="text-xs uppercase font-semibold tracking-wider">Shop</span>
                  </button>
                )}
              </div>
              
              {/* Tab Content */}
              <div className="p-2 md:p-4">
                {activeTab === 'posts' && (
                  <>
                    {postsError && (
                      <div className="bg-red-50 text-red-500 p-4 rounded mb-4">
                        <p>There was an error loading posts.</p>
                        <button 
                          onClick={handleRetryFetch}
                          className="underline text-gtgram-green mt-2"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    
                    {!postsError && posts && posts.length > 0 ? (
                      <PostGrid posts={posts} />
                    ) : !postsError && !isPostsLoading ? (
                      <div className="text-center py-14">
                        <div className="border border-gtgram-gray inline-flex p-6 rounded-full mb-4">
                          <AiOutlineCamera size={36} className="text-gtgram-dark" />
                        </div>
                        <p className="text-xl mb-4 font-light">No Posts Yet</p>
                        {isOwnProfile && (
                          <Link href="/create-post" className="text-gtgram-green font-medium">
                            Share your first post
                          </Link>
                        )}
                      </div>
                    ) : null}
                  </>
                )}
                
                {activeTab === 'saved' && isOwnProfile && (
                  savedPosts.length > 0 ? (
                    <PostGrid posts={savedPosts} />
                  ) : (
                    <div className="text-center py-14">
                      <div className="border border-gtgram-gray inline-flex p-6 rounded-full mb-4">
                        <BsBookmark size={32} className="text-gtgram-dark" />
                      </div>
                      <p className="text-xl mb-4 font-light">Save</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
                      </p>
                    </div>
                  )
                )}
                
                {activeTab === 'tagged' && (
                  <div className="text-center py-14">
                    <div className="border border-gtgram-gray inline-flex p-6 rounded-full mb-4">
                      <FiTag size={32} className="text-gtgram-dark" />
                    </div>
                    <p className="text-xl mb-4 font-light">Photos of you</p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      When people tag you in photos, they'll appear here.
                    </p>
                  </div>
                )}
                
                {activeTab === 'shop' && isOwnProfile && (
                  <div className="text-center py-14">
                    <div className="border border-gtgram-gray inline-flex p-6 rounded-full mb-4">
                      <FaShopify size={32} className="text-gtgram-dark" />
                    </div>
                    <p className="text-xl mb-4 font-light">Shop</p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Posts with product links will appear here. Share products with your audience.
                    </p>
                    {isOwnProfile && (
                      <Link href="/create-post" className="mt-4 inline-block text-gtgram-green font-medium">
                        Create a shopping post
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PostCard from './PostCard';
import { Post } from '@/types/post';
import placeholders from '@/lib/placeholders';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Cache user data to avoid redundant Firestore requests
  const [userCache, setUserCache] = useState<Record<string, any>>({});

  // Get user data with caching
  const getUserData = useCallback(async (userId: string) => {
    // Return from cache if available
    if (userCache[userId]) {
      return userCache[userId];
    }
    
    // Otherwise fetch from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    // Update cache
    setUserCache(prev => ({
      ...prev,
      [userId]: userData
    }));
    
    return userData;
  }, [userCache]);

  // Format post with user data
  const formatPost = useCallback(async (postDoc: any) => {
    const postData = postDoc.data();
    const userData = await getUserData(postData.userId);
    
    return {
      id: postDoc.id,
      userId: postData.userId,
      username: userData ? userData.username : 'Unknown User',
      userPhotoURL: userData ? userData.photoURL || placeholders.avatar : placeholders.avatar,
      caption: postData.caption || '',
      mediaUrls: postData.mediaUrls || (postData.imageUrl ? [postData.imageUrl] : []),
      mediaType: postData.mediaType || 'image',
      likes: postData.likes || [],
      comments: [],
      createdAt: postData.createdAt,
      location: postData.location || null,
      tags: postData.tags || [],
      productInfo: postData.productInfo || null,
      bluemark: userData?.bluemark || false
    };
  }, [getUserData]);

  useEffect(() => {
    // Get posts from the last 30 days for better performance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Create an optimized query with additional filter
    const postsQuery = query(
      collection(db, 'posts'),
      where('createdAt', '>', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      try {
        setLoading(true);
        
        // Process posts in batches for better performance
        const processedPosts = await Promise.all(
          snapshot.docs.map(doc => formatPost(doc))
        );
        
        setPosts(processedPosts);
      } catch (error) {
        console.error('Error processing posts:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });
    
    // Cleanup function
    return () => unsubscribe();
  }, [formatPost]);

  // Memoize like/unlike handler to prevent recreation on each render
  const handleLike = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) return;
      
      const postLikes = postDoc.data().likes || [];
      const isLiked = postLikes.includes(user.uid);
      
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error updating like:', error);
    }
  }, [user]);

  // Memoize empty state message
  const emptyStateMessage = useMemo(() => (
    <div className="text-center py-10">
      <p className="text-xl mb-2 text-gtgram-dark">No posts yet</p>
      <p className="text-gtgram-dark text-opacity-70">Follow more people or create your first post</p>
    </div>
  ), []);

  return (
    <div className="max-w-xl mx-auto">
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gtgram-green"></div>
        </div>
      )}
      
      {/* No posts state */}
      {!loading && posts.length === 0 && emptyStateMessage}
      
      {/* Posts feed */}
      {posts.map(post => (
        <PostCard 
          key={post.id}
          post={post}
          onLike={handleLike}
        />
      ))}
    </div>
  );
} 
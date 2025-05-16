import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, orderBy, limit, QueryConstraint } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { User } from '@/types/user';
import { Post } from '@/types/post';
import { ref, deleteObject } from 'firebase/storage';

// Utility function to validate and normalize post data
function validatePostData(data: any, postId: string): Post | null {
  if (!data) return null;
  
  // Check for essential fields
  if (!data.userId) {
    console.warn(`Post ${postId} is missing userId, might not appear in profiles`);
  }
  
  // If media is empty or invalid, this post can't be displayed properly
  if (!data.media || !Array.isArray(data.media) || data.media.length === 0) {
    console.warn(`Post ${postId} has no valid media`);
  }
  
  // Ensure createdAt exists in some form
  let createdAt = data.createdAt;
  if (!createdAt) {
    console.warn(`Post ${postId} missing createdAt timestamp, using current time`);
    createdAt = new Date();
  }
  
  // Return normalized post object
  return {
    id: postId,
    userId: data.userId || 'unknown',
    caption: data.caption || '',
    media: Array.isArray(data.media) ? data.media : [],
    likes: Array.isArray(data.likes) ? data.likes : [],
    comments: Array.isArray(data.comments) ? data.comments : [],
    createdAt: createdAt,
    location: data.location || '',
    ...data // Include any other fields that might exist
  };
}

// Generic hook for fetching a collection with query constraints
export function useFirestoreCollection<T>(
  collectionName: string,
  queryKey: string[],
  queryConstraints: QueryConstraint[] = [],
  options = {}
) {
  return useQuery({
    queryKey: ['firestore', collectionName, ...queryKey],
    queryFn: async () => {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as T);
      });
      
      return data;
    },
    ...options,
  });
}

// Hook for fetching a single document
export function useFirestoreDocument<T>(
  collectionName: string,
  documentId: string | undefined,
  options = {}
) {
  return useQuery({
    queryKey: ['firestore', collectionName, documentId],
    queryFn: async () => {
      if (!documentId) return null;
      
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      
      return null;
    },
    enabled: !!documentId, // Only run the query if documentId is provided
    ...options,
  });
}

// Mutation hook for updating a document
export function useUpdateDocument(collectionName: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      documentId, 
      data 
    }: { 
      documentId: string; 
      data: Record<string, any> 
    }) => {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, data);
      return { id: documentId, ...data };
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch the document and any collection queries that might include it
      queryClient.invalidateQueries({ 
        queryKey: ['firestore', collectionName, variables.documentId] 
      });
      queryClient.invalidateQueries({
        queryKey: ['firestore', collectionName]
      });
    },
  });
}

// Mutation hook for deleting a document
export function useDeleteDocument(collectionName: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (documentId: string) => {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      return documentId;
    },
    onSuccess: (documentId) => {
      // Invalidate and refetch the document and any collection queries that might include it
      queryClient.invalidateQueries({ 
        queryKey: ['firestore', collectionName, documentId] 
      });
      queryClient.invalidateQueries({
        queryKey: ['firestore', collectionName]
      });
    },
  });
}

// Specialized hook for deleting posts (handles post media cleanup as well)
export function useDeletePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, mediaUrls = [] }: { postId: string, mediaUrls?: string[] }) => {
      // First, try to delete the post document
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      
      // Next, attempt to delete media files from storage if URLs are provided
      // Note: This may fail if URL format doesn't match exactly, but we'll try our best
      const mediaDeletePromises = mediaUrls.map(async (url) => {
        try {
          // Extract the path from the Firebase Storage URL
          // This is a best effort to parse the URL and might need adjustment based on your URL format
          if (url && url.includes('firebasestorage.googleapis.com')) {
            const pathStart = url.indexOf('/o/') + 3;
            const pathEnd = url.indexOf('?');
            if (pathStart > 0 && pathEnd > pathStart) {
              let storagePath = decodeURIComponent(url.substring(pathStart, pathEnd));
              const storageRef = ref(storage, storagePath);
              await deleteObject(storageRef);
              console.log(`Deleted media: ${storagePath}`);
            }
          }
        } catch (error) {
          console.error(`Failed to delete media: ${url}`, error);
          // Continue with other deletions even if one fails
        }
      });
      
      // Wait for all media deletions to complete or fail
      await Promise.allSettled(mediaDeletePromises);
      
      return postId;
    },
    onSuccess: (postId) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ 
        queryKey: ['firestore', 'posts'] 
      });
      // Also invalidate any specific queries for this post
      queryClient.invalidateQueries({
        queryKey: ['firestore', 'posts', postId]
      });
    },
  });
}

// Specialized hooks for common queries
export function usePosts(userId?: string, options = {}) {
  const constraints: QueryConstraint[] = [];
  
  if (userId) {
    constraints.push(where('userId', '==', userId));
  }
  
  // Try to sort by createdAt, but don't let it fail if field doesn't exist
  try {
    constraints.push(orderBy('createdAt', 'desc'));
  } catch (error) {
    console.warn('Error adding createdAt ordering, some documents may not have this field');
  }
  
  return useQuery<Post[]>({
    queryKey: ['firestore', 'posts', userId ? ['byUser', userId] : ['all']],
    queryFn: async () => {
      try {
        console.log(`Attempting to fetch posts for user: ${userId || 'all'}`);
        const postsRef = collection(db, 'posts');
        let q;
        
        if (userId) {
          q = query(postsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
          console.log(`Query created with userId filter: ${userId}`);
        } else {
          q = query(postsRef, orderBy('createdAt', 'desc'));
          console.log('Query created for all posts');
        }
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log(`No posts found for user ${userId || 'all'} using primary query`);
          
          // Try a simpler query without ordering as first fallback
          if (userId) {
            console.log('Attempting fallback query without ordering...');
            const fallbackQuery = query(postsRef, where('userId', '==', userId));
            const fallbackSnapshot = await getDocs(fallbackQuery);
            
            if (fallbackSnapshot.empty) {
              console.log('Fallback query also returned no results');
              
              // Second fallback: verify if the user exists in any posts
              console.log('Checking if user exists in any posts...');
              const allPostsSnapshot = await getDocs(collection(db, 'posts'));
              const matchingPosts: Post[] = [];
              
              allPostsSnapshot.forEach(doc => {
                const postData = doc.data();
                if (postData.userId === userId) {
                  const validatedPost = validatePostData(postData, doc.id);
                  if (validatedPost) {
                    matchingPosts.push(validatedPost);
                    console.log(`Found matching post with ID: ${doc.id}`);
                  }
                }
              });
              
              if (matchingPosts.length > 0) {
                console.log(`Found ${matchingPosts.length} posts through manual filtering`);
                return matchingPosts.sort((a, b) => {
                  const aTime = a.createdAt?.toDate?.() || new Date(0);
                  const bTime = b.createdAt?.toDate?.() || new Date(0);
                  return bTime.getTime() - aTime.getTime();
                });
              }
              
              return [];
            }
            
            const posts: Post[] = [];
            fallbackSnapshot.forEach((doc) => {
              const validatedPost = validatePostData(doc.data(), doc.id);
              if (validatedPost) {
                posts.push(validatedPost);
              }
            });
            
            console.log(`Found ${posts.length} posts using fallback query`);
            return posts.sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date(0);
              const bTime = b.createdAt?.toDate?.() || new Date(0);
              return bTime.getTime() - aTime.getTime();
            });
          }
          
          return [];
        }
        
        const posts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const validatedPost = validatePostData(doc.data(), doc.id);
          if (validatedPost) {
            posts.push(validatedPost);
          }
        });
        
        console.log(`Successfully fetched ${posts.length} posts for user ${userId || 'all'}`);
        return posts;
      } catch (error) {
        console.error('Error fetching posts:', error);
        
        // Fallback: try fetching without the orderBy if that's causing issues
        if (String(error).includes('missing index') || String(error).includes('No matching index found')) {
          console.log('Index error detected, trying fallback query without ordering');
          const postsRef = collection(db, 'posts');
          let fallbackQuery;
          
          if (userId) {
            fallbackQuery = query(postsRef, where('userId', '==', userId));
          } else {
            fallbackQuery = query(postsRef);
          }
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const posts: Post[] = [];
          fallbackSnapshot.forEach((doc) => {
            const data = doc.data();
            // Verify this is the right user's post
            if (!userId || data.userId === userId) {
              const validatedPost = validatePostData(data, doc.id);
              if (validatedPost) {
                posts.push(validatedPost);
              }
            }
          });
          
          console.log(`Fallback query found ${posts.length} posts`);
          
          // Client-side sort as a fallback
          return posts.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });
        }
        
        throw error;
      }
    },
    ...options,
  });
}

export function useUserProfile(userId: string | undefined, options = {}) {
  return useFirestoreDocument<User>('users', userId, options);
}

export function useSavedPosts(savedPostIds: string[] = [], options = {}) {
  return useQuery<Post[]>({
    queryKey: ['firestore', 'posts', 'saved', savedPostIds],
    queryFn: async () => {
      if (!savedPostIds.length) return [];
      
      const posts: Post[] = [];
      // Fetch in batches of 10 to avoid large queries
      for (let i = 0; i < savedPostIds.length; i += 10) {
        const batch = savedPostIds.slice(i, i + 10);
        const promises = batch.map(id => getDoc(doc(db, 'posts', id)));
        const docs = await Promise.all(promises);
        
        for (const doc of docs) {
          if (doc.exists()) {
            posts.push({ id: doc.id, ...doc.data() } as Post);
          }
        }
      }
      
      // Sort by createdAt if available
      return posts.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
    },
    enabled: savedPostIds.length > 0,
    ...options,
  });
} 
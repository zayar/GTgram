'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { Post as PostType } from '@/types/post';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import placeholders from '@/lib/placeholders';
import ImageCarousel from '@/components/post/ImageCarousel';
import ProductInfo from '@/components/post/ProductInfo';
import BlueMark from '@/components/ui/BlueMark';
import { RiShoppingBagFill } from 'react-icons/ri';
import ReactionButton from '@/components/post/ReactionButton';

// Define a simpler Comment type for this page
interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: any;
  user: {
    username: string;
    photoURL: string;
    bluemark?: boolean;
  };
  reactions?: string[]; // Array of user IDs who have reacted to this comment
}

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<PostType | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchPostData = async () => {
      if (!id || typeof id !== 'string') {
        setError("Invalid post ID");
        setLoading(false);
        return;
      }

      try {
        // Fetch post data
        const postDoc = await getDoc(doc(db, 'posts', id));
        if (!postDoc.exists()) {
          setError("Post not found");
          setLoading(false);
          return;
        }

        const postData = postDoc.data();
        
        // Fetch post author data to get bluemark status
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const bluemark = userData?.bluemark || false;
        
        const formattedPost: PostType = { 
          id: postDoc.id, 
          ...postData,
          likes: postData.likes || [],
          mediaUrls: postData.mediaUrls || [],
          comments: [], // We'll load comments separately
          productInfo: postData.productInfo || null,
          bluemark
        } as unknown as PostType;
        
        setPost(formattedPost);
        
        // Check if current user has liked the post
        if (currentUser) {
          setLiked(formattedPost.likes.includes(currentUser.uid));
        }
          
        // Set user data
        if (userDoc.exists()) {
          setUser(userDoc.data());
        }
        
        // Fetch comments
        const commentsQuery = query(
          collection(db, 'posts', id, 'comments'),
          orderBy('createdAt', 'asc')
        );
        
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsList = await Promise.all(
          commentsSnapshot.docs.map(async (commentDoc) => {
            const commentData = commentDoc.data();
            const userDocRef = doc(db, 'users', commentData.userId);
            const userSnap = await getDoc(userDocRef);
            let userName = 'Unknown User';
            let userPhoto = placeholders.avatar;
            let bluemark = false;

            if (userSnap.exists()) {
              const userData = userSnap.data();
              userName = userData.username || 'Anonymous';
              userPhoto = userData.photoURL || placeholders.avatar;
              bluemark = userData.bluemark || false;
            }
            
            return {
              id: commentDoc.id,
              text: commentData.text,
              userId: commentData.userId,
              postId: commentData.postId || id,
              createdAt: commentData.createdAt,
              reactions: commentData.reactions || [], // Add reactions field
              user: {
                username: userName,
                photoURL: userPhoto,
                bluemark
              }
            } as Comment;
          })
        );
        
        setComments(commentsList);
        
        // Check if post is saved by current user
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setSaved(userData.savedPosts?.includes(id) || false);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching post data:', error);
        setError("Failed to load post");
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPostData();
    } else {
      // Wait for auth to initialize
      const timer = setTimeout(() => {
        fetchPostData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser || !post) return;
    
    try {
      const postRef = doc(db, 'posts', post.id);
      
      if (liked) {
        // Unlike post
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
        setPost({
          ...post,
          likes: post.likes.filter(id => id !== currentUser.uid)
        });
      } else {
        // Like post
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });
        setPost({
          ...post,
          likes: [...post.likes, currentUser.uid]
        });
      }
      
      setLiked(!liked);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !post) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (saved) {
        // Unsave post
        await updateDoc(userRef, {
          savedPosts: arrayRemove(post.id)
        });
      } else {
        // Save post
        await updateDoc(userRef, {
          savedPosts: arrayUnion(post.id)
        });
      }
      
      setSaved(!saved);
    } catch (error) {
      console.error('Error updating saved posts:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !post || !commentText.trim()) return;
    
    try {
      const newComment = {
        postId: post.id,
        userId: currentUser.uid,
        text: commentText,
        createdAt: serverTimestamp(),
        reactions: [] // Initialize empty reactions array
      };
      
      const docRef = await addDoc(collection(db, 'posts', post.id, 'comments'), newComment);
      
      // Add to local state with properly typed timestamp
      const newCommentForState: Comment = {
        id: docRef.id,
        postId: post.id,
        userId: currentUser.uid,
        text: commentText,
        createdAt: Timestamp.now(),
        reactions: [], // Initialize empty reactions array
        user: {
          username: currentUser.displayName || 'Anonymous',
          photoURL: currentUser.photoURL || placeholders.avatar
        }
      };
      
      setComments([...comments, newCommentForState]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCommentReaction = async (commentId: string) => {
    if (!currentUser || !post) return;
    
    try {
      // Find the comment in our local state
      const commentIndex = comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) return;
      
      const comment = comments[commentIndex];
      const hasReacted = comment.reactions?.includes(currentUser.uid);
      
      // Reference to the comment document
      const commentRef = doc(db, 'posts', post.id, 'comments', commentId);
      
      if (hasReacted) {
        // Remove reaction
        await updateDoc(commentRef, {
          reactions: arrayRemove(currentUser.uid)
        });
        
        // Update local state
        const updatedComments = [...comments];
        updatedComments[commentIndex] = {
          ...comment,
          reactions: comment.reactions?.filter(id => id !== currentUser.uid) || []
        };
        setComments(updatedComments);
      } else {
        // Add reaction
        await updateDoc(commentRef, {
          reactions: arrayUnion(currentUser.uid)
        });
        
        // Update local state
        const updatedComments = [...comments];
        updatedComments[commentIndex] = {
          ...comment,
          reactions: [...(comment.reactions || []), currentUser.uid]
        };
        setComments(updatedComments);
      }
    } catch (error) {
      console.error('Error updating comment reaction:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gtgram-green"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-gtgram-dark mb-4">
            {error || "Post not found"}
          </h1>
          <Link href="/home" className="text-gtgram-green hover:underline">
            Return to Home
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg overflow-hidden shadow-md">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Media */}
          <div className="md:w-3/5 bg-black">
            {post.mediaType === 'video' ? (
              <div className="relative aspect-square">
                <video 
                  src={post.mediaUrls?.[0] || ''} 
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="relative aspect-square">
                <ImageCarousel images={post.mediaUrls || []} aspectRatio="square" />
              </div>
            )}
          </div>
          
          {/* Right side - Info and Comments */}
          <div className="md:w-2/5 flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gtgram-gray">
              <Link href={`/profile/${post.userId}`} className="flex items-center">
                <div className="w-8 h-8 relative rounded-full overflow-hidden mr-3">
                  <Image 
                    src={user?.photoURL || placeholders.avatar} 
                    alt={user?.username || 'User'} 
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-gtgram-dark">{user?.username || 'User'}</span>
                  {post.bluemark && <BlueMark />}
                </div>
              </Link>
            </div>
            
            {/* Caption and Comments */}
            <div className="flex-grow overflow-y-auto p-4">
              {/* Caption */}
              {post.caption && (
                <div className="flex mb-4">
                  <Link href={`/profile/${post.userId}`} className="flex-shrink-0">
                    <div className="w-8 h-8 relative rounded-full overflow-hidden mr-3">
                      <Image 
                        src={user?.photoURL || placeholders.avatar} 
                        alt={user?.username || 'User'} 
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                  <div>
                    <div className="flex items-center">
                      <Link href={`/profile/${post.userId}`} className="font-semibold text-gtgram-dark mr-2">
                        {user?.username || 'User'}
                      </Link>
                      {post.bluemark && <BlueMark />}
                    </div>
                    <span className="text-gtgram-dark">{post.caption}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.createdAt && post.createdAt.toDate ? 
                        formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 
                        'Recently'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Product Information */}
              {post.productInfo && post.productInfo.link && (
                <div className="mb-4">
                  <ProductInfo productInfo={post.productInfo} />
                </div>
              )}
              
              {/* Comments */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex group">
                    <Link href={`/profile/${comment.userId}`} className="flex-shrink-0">
                      <div className="w-8 h-8 relative rounded-full overflow-hidden mr-3">
                        <Image 
                          src={comment.user.photoURL} 
                          alt={comment.user.username} 
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <Link href={`/profile/${comment.userId}`} className="font-semibold text-gtgram-dark mr-2">
                          {comment.user.username}
                        </Link>
                        {comment.user.bluemark && <BlueMark size={12} />}
                      </div>
                      <span className="text-gtgram-dark">{comment.text}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.createdAt && comment.createdAt.toDate ? 
                          formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 
                          'Recently'}
                      </p>
                    </div>
                    <div className="ml-2 flex items-start">
                      <ReactionButton 
                        isReacted={comment.reactions?.includes(currentUser?.uid || '') || false}
                        reactionCount={comment.reactions?.length || 0}
                        onReact={() => handleCommentReaction(comment.id)}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="p-4 border-t border-gtgram-gray">
              <div className="flex justify-between mb-3">
                <div className="flex space-x-4">
                  <button onClick={handleLike} className="text-2xl text-gtgram-green">
                    {liked ? <AiFillHeart /> : <AiOutlineHeart />}
                  </button>
                  
                  {/* Shopping Bag Icon (only shown if post has product info) */}
                  {post.productInfo && (
                    <Link href={post.productInfo?.link || '#'} target="_blank" rel="noopener noreferrer" className="mr-4">
                      <RiShoppingBagFill className="text-2xl text-gtgram-green hover:text-gtgram-light-green transition-colors" />
                    </Link>
                  )}
                </div>
                <button onClick={handleSave} className="text-2xl text-gtgram-green">
                  {saved ? <BsBookmarkFill /> : <BsBookmark />}
                </button>
              </div>
              
              {/* Likes count */}
              <div className="font-semibold text-gtgram-dark mb-2">
                {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
              </div>
              
              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="flex mt-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-grow bg-transparent focus:outline-none text-gtgram-dark border-b border-gtgram-gray pb-1"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className={`ml-2 font-semibold ${
                    !commentText.trim() ? 'text-gtgram-green/50 cursor-not-allowed' : 'text-gtgram-green'
                  }`}
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 
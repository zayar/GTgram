'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { AiOutlineHeart, AiFillHeart, AiOutlineMessage, AiOutlineShoppingCart, AiOutlineClose } from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { RiShoppingBagFill } from 'react-icons/ri';
import ImageCarousel from './ImageCarousel';
import { useAuth } from '@/components/auth/AuthProvider';
import ProductInfo from './ProductInfo';
import BlueMark from '@/components/ui/BlueMark';
import UserAvatar from '@/components/ui/UserAvatar';
import PostActionsMenu from './PostActionsMenu';
import placeholders from '@/lib/placeholders';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  isDetailView?: boolean;
}

// Default inline avatar as base64 - guaranteed to work
const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0UwRTBFMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPlVzZXI8L3RleHQ+PC9zdmc+";

export default function PostCard({ post, onLike, isDetailView = false }: PostCardProps) {
  const { user } = useAuth();
  const likes = post?.likes || [];
  const [isLiked, setIsLiked] = useState(user ? likes.includes(user.uid) : false);
  const [likesCount, setLikesCount] = useState(likes.length);
  const [showAllCaption, setShowAllCaption] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showProductFrame, setShowProductFrame] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Check if the post is saved by the current user
    const checkIfSaved = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedPosts = userData.savedPosts || [];
          setIsSaved(savedPosts.includes(post.id));
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkIfSaved();
  }, [user, post.id]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showProductFrame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showProductFrame]);

  const handleLike = async () => {
    if (!user || !onLike) return;
    
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    await onLike(post.id);
  };

  const handleSave = async () => {
    if (!user || !post) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      if (isSaved) {
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
      
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error updating saved posts:', error);
    }
  };

  const toggleProductFrame = () => {
    setShowProductFrame(!showProductFrame);
  };

  if (!post) return null;
  
  const hasProductInfo = post.productInfo && post.productInfo.link;
  const shouldTruncateCaption = !showAllCaption && post.caption && post.caption.length > 120 && !isDetailView;
  const captionToShow = shouldTruncateCaption ? `${post.caption.substring(0, 120)}...` : post.caption;

  const mediaUrls = post.mediaUrls || (post.media && Array.isArray(post.media) ? 
    post.media.map(item => typeof item === 'string' ? item : item.url) : 
    []);

  return (
    <div className="bg-white border-b md:border border-gtgram-gray md:rounded-lg mb-2 md:mb-6 w-full overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center p-2 sm:p-3 md:p-4">
        <Link href={`/profile/${post.userId}`} className="flex items-center flex-grow min-w-0">
          <UserAvatar
            src={post.userPhotoURL}
            alt={post.username || 'User'}
            size={32}
            className="mr-2 sm:mr-3 flex-shrink-0"
          />
          <div className="flex items-center min-w-0">
            <span className="font-semibold text-gtgram-dark text-sm sm:text-base truncate">{post.username}</span>
            {post.bluemark && <BlueMark size={12} className="ml-1 flex-shrink-0" />}
          </div>
        </Link>
        
        {/* Post Actions Menu */}
        <PostActionsMenu 
          postId={post.id}
          userId={post.userId}
          currentUserId={user?.uid}
          mediaUrls={mediaUrls}
        />
      </div>

      {/* Post Media */}
      {post.mediaType === 'video' ? (
        <div className="relative aspect-square md:aspect-[4/5] w-full">
          <video
            src={mediaUrls[0] || ''}
            controls
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ) : (
        <ImageCarousel images={mediaUrls} />
      )}

      {/* Post Actions */}
      <div className="p-2 sm:p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={handleLike}
              className="text-xl sm:text-2xl text-gtgram-dark hover:text-gtgram-green transition-colors"
            >
              {isLiked ? <AiFillHeart className="text-gtgram-green" /> : <AiOutlineHeart />}
            </button>
            <Link href={`/post/${post.id}`}>
              <AiOutlineMessage className="text-xl sm:text-2xl text-gtgram-dark hover:text-gtgram-green transition-colors" />
            </Link>
          </div>
          
          <div className="flex items-center">
            {/* Shopping Bag Icon (only shown if post has product info) */}
            {hasProductInfo && (
              <button 
                onClick={toggleProductFrame}
                className="mr-3 sm:mr-4"
                aria-label="View product"
              >
                <RiShoppingBagFill className="text-xl sm:text-2xl text-gtgram-green hover:text-gtgram-light-green transition-colors" />
              </button>
            )}
            <button onClick={handleSave} className="text-xl sm:text-2xl text-gtgram-dark hover:text-gtgram-green transition-colors">
              {isSaved ? <BsBookmarkFill className="text-gtgram-green" /> : <BsBookmark />}
            </button>
          </div>
        </div>

        {/* Likes Count */}
        <div className="mt-2 font-semibold text-gtgram-dark text-sm sm:text-base">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mt-1">
            <div className="flex flex-wrap">
              <span className="font-semibold text-gtgram-dark mr-2 text-sm sm:text-base">{post.username}</span>
              <span className="text-gtgram-dark text-sm sm:text-base break-words">
                {captionToShow}
                {shouldTruncateCaption && (
                  <button 
                    onClick={() => setShowAllCaption(true)}
                    className="text-gtgram-dark ml-2 opacity-50 hover:opacity-75"
                  >
                    more
                  </button>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Location */}
        {post.location && (
          <div className="text-xs sm:text-sm text-gtgram-dark opacity-70 mt-1">
            📍 {post.location}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs sm:text-sm text-gtgram-dark opacity-50 mt-2">
          {post.createdAt && typeof post.createdAt === 'object' && post.createdAt !== null && 'toDate' in post.createdAt 
            ? formatDistanceToNow((post.createdAt as any).toDate(), { addSuffix: true })
            : post.createdAt && post.createdAt instanceof Date 
            ? formatDistanceToNow(post.createdAt, { addSuffix: true })
            : 'Recently'
          }
        </div>
      </div>

      {/* Product Info Frame Modal */}
      {showProductFrame && hasProductInfo && post.productInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 sm:p-4">
          <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-lg overflow-hidden">
            {/* Close button */}
            <button
              onClick={toggleProductFrame}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <AiOutlineClose size={20} />
            </button>
            
            {/* Product Info Component */}
            <ProductInfo productInfo={post.productInfo} />
          </div>
        </div>
      )}
    </div>
  );
} 
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
    <div className="bg-white border-b md:border border-gtgram-gray md:rounded-lg mb-4 md:mb-6">
      {/* Post Header */}
      <div className="flex items-center p-3 md:p-4">
        <Link href={`/profile/${post.userId}`} className="flex items-center flex-grow">
          <UserAvatar
            src={post.userPhotoURL}
            alt={post.username || 'User'}
            size={32}
            className="mr-3"
          />
          <div className="flex items-center">
            <span className="font-semibold text-gtgram-dark">{post.username}</span>
            {post.bluemark && <BlueMark size={12} className="ml-1" />}
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
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className="text-2xl text-gtgram-dark hover:text-gtgram-green transition-colors"
            >
              {isLiked ? <AiFillHeart className="text-gtgram-green" /> : <AiOutlineHeart />}
            </button>
            <Link href={`/post/${post.id}`}>
              <AiOutlineMessage className="text-2xl text-gtgram-dark hover:text-gtgram-green transition-colors" />
            </Link>
          </div>
          
          <div className="flex items-center">
            {/* Shopping Bag Icon (only shown if post has product info) */}
            {hasProductInfo && (
              <button 
                onClick={toggleProductFrame}
                className="mr-4"
                aria-label="View product"
              >
                <RiShoppingBagFill className="text-2xl text-gtgram-green hover:text-gtgram-light-green transition-colors" />
              </button>
            )}
            <button onClick={handleSave} className="text-2xl text-gtgram-dark hover:text-gtgram-green transition-colors">
              {isSaved ? <BsBookmarkFill className="text-gtgram-green" /> : <BsBookmark />}
            </button>
          </div>
        </div>

        {/* Likes Count */}
        <div className="mt-2 font-semibold text-gtgram-dark">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mt-1">
            <div className="flex">
              <Link href={`/profile/${post.userId}`} className="font-semibold text-gtgram-dark mr-1">
                {post.username}
              </Link>
              <span className="text-gtgram-dark">{captionToShow}</span>
            </div>
            {shouldTruncateCaption && (
              <button 
                onClick={() => setShowAllCaption(true)}
                className="text-gray-500 text-sm"
              >
                more
              </button>
            )}
          </div>
        )}
        
        {/* Product Info - with click handler */}
        {hasProductInfo && post.productInfo && (
          <div className="mt-3">
            {/* Small hint text to indicate clickable */}
            <div className="flex items-center justify-center text-xs text-gtgram-green mb-1">
              <RiShoppingBagFill className="mr-1" /> 
              <span>Tap to view product</span>
            </div>
            <ProductInfo 
              productInfo={post.productInfo} 
              onProductClick={toggleProductFrame}
            />
          </div>
        )}

        {/* Comments Count */}
        {post.comments?.length > 0 && (
          <Link href={`/post/${post.id}`} className="block mt-1 text-gray-500 text-sm">
            View all {post.comments.length} comments
          </Link>
        )}

        {/* Timestamp */}
        <div className="mt-1 text-xs text-gray-500">
          {formatDistanceToNow(post.createdAt?.toDate() || new Date(), { addSuffix: true })}
        </div>
      </div>
      
      {/* Comment Input - mobile style like Instagram */}
      <div className="px-3 py-2 border-t border-gtgram-gray md:hidden">
        <div className="flex items-center">
          <UserAvatar 
            src={user?.photoURL}
            alt="Your profile"
            size={32}
            className="mr-2"
          />
          <input
            type="text"
            placeholder="Add a comment..."
            className="bg-transparent text-sm flex-grow focus:outline-none"
          />
          <button className="text-gtgram-green text-sm font-semibold opacity-50">Post</button>
        </div>
      </div>

      {/* Slide Up Product Modal */}
      {showProductFrame && hasProductInfo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col justify-end"
          onClick={toggleProductFrame}
        >
          <div 
            className="bg-white rounded-t-3xl w-full max-h-[70vh] transition-transform duration-300 transform animate-slide-up shadow-2xl border-t border-gtgram-gray"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gtgram-gray sticky top-0 z-10 bg-white">
              <div className="font-medium flex items-center overflow-hidden">
                <RiShoppingBagFill className="text-gtgram-green mr-2 flex-shrink-0" size={20} />
                <div className="overflow-hidden">
                  <p className="text-lg truncate">{post.productInfo?.name || 'Product'}</p>
                  {post.productInfo && typeof post.productInfo === 'object' && 
                   'price' in post.productInfo && 
                   typeof post.productInfo.price === 'string' && (
                    <p className="text-sm text-gray-500">{post.productInfo.price}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={toggleProductFrame}
                className="text-gtgram-dark p-2 rounded-full hover:bg-gray-100 transition-colors ml-2 flex-shrink-0"
                aria-label="Close product view"
              >
                <AiOutlineClose size={22} />
              </button>
            </div>
            
            {/* Product iframe */}
            <div className="relative h-[450px] max-h-[calc(70vh-70px)] w-full bg-white" ref={iframeRef}>
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gtgram-green"></div>
                <span className="ml-3 text-gray-500">Loading product...</span>
              </div>
              <iframe 
                src={post.productInfo?.link} 
                className="absolute inset-0 w-full h-full border-0 z-10" 
                title="Product View"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AiFillHeart, AiOutlineMessage, AiOutlineWarning } from 'react-icons/ai';
import { BsImages, BsPlayFill } from 'react-icons/bs';
import { RiShoppingBagFill } from 'react-icons/ri';
import { Post } from '@/types/post';
import placeholders from '@/lib/placeholders';

interface PostGridProps {
  posts: Post[];
  columns?: 3 | 4 | 5;
}

export default function PostGrid({ posts = [], columns = 3 }: PostGridProps) {
  const [loadingErrors, setLoadingErrors] = useState<{[key: string]: boolean}>({});
  
  // Generate grid columns class based on props
  const gridClass = {
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
  }[columns];
  
  // Filter out potentially invalid posts
  const validPosts = posts.filter(post => {
    // Log invalid posts for debugging
    if (!post || !post.id) {
      console.warn('Invalid post detected in PostGrid:', post);
      return false;
    }
    return true;
  });
  
  if (validPosts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No valid posts available to display</p>
      </div>
    );
  }

  const handleImageError = (postId: string) => {
    setLoadingErrors(prev => ({...prev, [postId]: true}));
  };

  return (
    <div className={`grid ${gridClass} gap-1 md:gap-4`}>
      {validPosts.map((post) => {
        // Handle different media URL formats in Firestore
        // Some posts might use mediaUrls, some might use media array
        let firstMediaUrl = placeholders.post;
        let isMultiple = false;
        
        // Check if post has media field and it's an array
        if (post.media && Array.isArray(post.media) && post.media.length > 0) {
          if (typeof post.media[0] === 'string') {
            firstMediaUrl = post.media[0];
          } else if (post.media[0] && typeof post.media[0] === 'object' && 'url' in post.media[0]) {
            firstMediaUrl = post.media[0].url as string;
          }
          isMultiple = post.media.length > 1;
        } 
        // Legacy support for mediaUrls field
        else if (post.mediaUrls && Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
          firstMediaUrl = post.mediaUrls[0];
          isMultiple = post.mediaUrls.length > 1;
        }
        
        const isVideo = post.mediaType === 'video' || 
                       (post.media && Array.isArray(post.media) && post.media[0] && 
                       typeof post.media[0] === 'object' && post.media[0].type === 'video');
        
        const hasError = loadingErrors[post.id];
        
        return (
          <Link key={post.id} href={`/post/${post.id}`} className="block relative aspect-square group">
            {/* Post Image or Video Thumbnail */}
            {!hasError ? (
              <Image
                src={firstMediaUrl}
                alt={post.caption || 'Post'}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover group-hover:opacity-75 transition-opacity"
                onError={() => handleImageError(post.id)}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <AiOutlineWarning size={32} className="text-gray-400" />
              </div>
            )}
            
            {/* Media Type Indicators */}
            {isMultiple && (
              <div className="absolute top-2 right-2 text-white drop-shadow-md">
                <BsImages size={18} />
              </div>
            )}
            {isVideo && (
              <div className="absolute top-2 right-2 text-white drop-shadow-md">
                <BsPlayFill size={20} />
              </div>
            )}
            
            {/* Shopping Indicator */}
            {post.productInfo && post.productInfo.link && (
              <div className="absolute top-2 left-2 text-gtgram-green drop-shadow-md">
                <RiShoppingBagFill size={20} />
              </div>
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-60 transition-opacity flex items-center justify-center">
              <div className="flex items-center space-x-6 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center">
                  <AiFillHeart className="mr-2" size={20} />
                  <span className="font-medium">{post.likes?.length || 0}</span>
                </div>
                <div className="flex items-center">
                  <AiOutlineMessage className="mr-2" size={20} />
                  <span className="font-medium">{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 
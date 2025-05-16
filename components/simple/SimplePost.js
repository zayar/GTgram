'use client';

import { useState } from 'react';

export default function SimplePost({ username, image, caption, likes }) {
  const [likeCount, setLikeCount] = useState(likes);
  const [isLiked, setIsLiked] = useState(false);
  
  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg mb-6 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center">
        <div className="w-8 h-8 bg-gray-700 rounded-full mr-2"></div>
        <span className="font-bold">{username}</span>
      </div>
      
      {/* Image */}
      <div className="w-full">
        <img 
          src={image} 
          alt="Post" 
          className="w-full object-cover" 
        />
      </div>
      
      {/* Actions */}
      <div className="p-4">
        <div className="flex space-x-4 mb-2">
          <button onClick={handleLike}>
            {isLiked ? '❤️' : '🤍'}
          </button>
          <button>💬</button>
          <button>📤</button>
        </div>
        <p className="font-bold mb-1">{likeCount} likes</p>
        <p>
          <span className="font-bold mr-2">{username}</span>
          {caption}
        </p>
        <p className="text-gray-500 text-sm mt-2">2 HOURS AGO</p>
      </div>
      
      {/* Comment input */}
      <div className="p-4 border-t border-gray-800">
        <input 
          type="text"
          placeholder="Add a comment..."
          className="w-full bg-transparent outline-none"
        />
      </div>
    </div>
  );
} 
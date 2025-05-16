'use client';

import { useState } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReactionButtonProps {
  isReacted: boolean;
  reactionCount: number;
  onReact: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export default function ReactionButton({
  isReacted,
  reactionCount,
  onReact,
  size = 'md',
  showCount = true,
  className = ''
}: ReactionButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleClick = () => {
    onReact();
    
    // Add brief animation effect
    if (!isReacted) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <button 
        onClick={handleClick} 
        className={`${sizeClasses[size]} ${isAnimating ? 'animate-heartPulse' : ''} transition-all duration-200 opacity-80 hover:opacity-100`}
        aria-label={isReacted ? "Remove reaction" : "Add reaction"}
      >
        {isReacted ? 
          <AiFillHeart className="text-red-500" /> : 
          <AiOutlineHeart />}
      </button>
      {showCount && reactionCount > 0 && (
        <span className="text-xs text-gray-500 ml-1 min-w-[1rem]">{reactionCount}</span>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect, memo, useCallback } from 'react';

// Default inline avatar as base64 - guaranteed to work
const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0UwRTBFMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPlVzZXI8L3RleHQ+PC9zdmc+";

interface UserAvatarProps {
  src: string | null | undefined;
  alt?: string;
  size?: number;
  className?: string;
  border?: boolean;
  borderColor?: string;
}

function UserAvatar({ 
  src, 
  alt = 'User', 
  size = 32, 
  className = '',
  border = false,
  borderColor = 'border-gtgram-green'
}: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);
  const borderClass = border ? `border-2 ${borderColor}` : '';
  
  // Update avatar source when props change
  useEffect(() => {
    if (src) {
      setAvatarSrc(src);
    } else {
      setAvatarSrc(DEFAULT_AVATAR);
    }
  }, [src]);
  
  // Memoize the error handler to prevent recreating on each render
  const handleImageError = useCallback(() => {
    setAvatarSrc(DEFAULT_AVATAR);
  }, []);
  
  return (
    <div 
      className={`relative rounded-full overflow-hidden ${borderClass} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img 
        src={avatarSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(UserAvatar); 
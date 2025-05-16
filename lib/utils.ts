import { User } from 'firebase/auth';

/**
 * Generate a safe display name from a user
 * @param user Firebase user object
 * @returns A display name string
 */
export function getSafeDisplayName(user: User | null): string {
  if (!user) return 'Anonymous';
  
  if (user.displayName) return user.displayName;
  
  if (user.email) {
    // Extract username from email address
    return user.email.split('@')[0];
  }
  
  return 'User'; 
}

/**
 * Get a URL for a user avatar
 * Uses the user's photoURL if available, or generates a UI avatar
 * @param user Firebase user object
 * @returns A URL string for the avatar
 */
export function getUserAvatar(user: User | null): string {
  if (!user) return '/placeholders/avatar.svg';
  
  if (user.photoURL) return user.photoURL;
  
  // Generate a name for the UI Avatar service
  const name = getSafeDisplayName(user);
  
  // Use local placeholder instead of external service
  return `/placeholders/avatar.svg?name=${encodeURIComponent(name)}`;
}

/**
 * Format a date string from a Firebase timestamp or ISO string
 * @param timestamp Timestamp from Firebase or ISO date string
 * @returns A formatted date string
 */
export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return 'Just now';
  
  try {
    // Get date object from timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Calculate time difference in milliseconds
    const diff = Date.now() - date.getTime();
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    // Less than a minute
    if (seconds < 60) return 'Just now';
    
    // Less than an hour
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    
    // Less than a day
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    
    // Less than a week
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    // Format as date string
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Recently';
  }
} 
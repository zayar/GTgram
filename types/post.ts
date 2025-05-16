import { Timestamp } from 'firebase/firestore';

// Product type for tagging products in posts
export interface Product {
  id: string;
  name: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  image?: string;
  url?: string;
  images?: string[];
}

// Product information for shopping feature
export interface ProductInfo {
  link: string;
  name?: string;
  description?: string;
}

export interface MediaItem {
  url: string;
  type?: 'image' | 'video';
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  caption: string;
  
  // Support both legacy and new formats
  mediaUrls?: string[];
  // New format supports both string arrays and object arrays
  media?: (string | MediaItem)[];
  
  mediaType?: 'image' | 'video';
  likes: string[];  // Array of user IDs who liked the post
  comments: Comment[];
  createdAt: Timestamp;
  location?: string;
  tags?: string[];
  productInfo?: ProductInfo;
  bluemark?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
} 
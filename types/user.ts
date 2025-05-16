export interface User {
  uid: string;
  username: string;
  fullName?: string;
  email: string;
  photoURL: string;
  bio?: string;
  website?: string;
  gender?: string;
  followers?: string[];
  following?: string[];
  savedPosts?: string[];
  bluemark?: boolean;
} 
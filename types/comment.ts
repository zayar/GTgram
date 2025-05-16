import { Timestamp } from 'firebase/firestore';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
  user: {
    username: string;
    photoURL: string;
  };
  reactions?: string[]; // Array of user IDs who have reacted to this comment
} 
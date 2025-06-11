// Utility functions for validating user objects

export function isValidUser(user: any): boolean {
  return user && 
         typeof user === 'object' && 
         user.uid && 
         typeof user.uid === 'string' && 
         user.uid.length > 0;
}

export function isValidUserId(uid: any): boolean {
  return uid && 
         typeof uid === 'string' && 
         uid.length > 0;
}

export function getUserId(user: any): string | null {
  if (isValidUser(user)) {
    return user.uid;
  }
  return null;
}

// Helper to safely check if arrays include a user ID
export function arrayIncludesUserId(array: any, userId: string): boolean {
  if (!Array.isArray(array) || !isValidUserId(userId)) {
    return false;
  }
  return array.includes(userId);
}

// Create a clean, serializable user object for localStorage
export function createCleanUserObject(userData: any): any {
  if (!userData || !userData.uid) {
    console.error('Cannot create clean user object - invalid userData:', userData);
    return null;
  }

  const cleanUser = {
    uid: userData.uid,
    email: userData.email || null,
    displayName: userData.displayName || userData.fullName || null,
    photoURL: userData.photoURL || null,
    username: userData.username || null,
    fullName: userData.fullName || userData.displayName || null,
    bio: userData.bio || '',
    followers: Array.isArray(userData.followers) ? userData.followers : [],
    following: Array.isArray(userData.following) ? userData.following : [],
    phoneNumber: userData.phoneNumber || null,
    emailVerified: !!userData.emailVerified,
    providerId: userData.providerId || 'auto_action',
    // Only include simple, serializable metadata
    metadata: {
      creationTime: userData.metadata?.creationTime || new Date().toISOString(),
      lastSignInTime: userData.metadata?.lastSignInTime || new Date().toISOString()
    },
    // Don't include functions or complex objects that can't be serialized
    createdVia: userData.createdVia || 'manual'
  };

  console.log('Created clean user object:', cleanUser);
  return cleanUser;
} 
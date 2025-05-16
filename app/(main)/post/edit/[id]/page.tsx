'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { Post } from '@/types/post';
import ImageCarousel from '@/components/post/ImageCarousel';

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  
  // Fetch the post
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const postData = { id: docSnap.id, ...docSnap.data() } as Post;
          
          // Check if current user is the post owner
          if (user?.uid !== postData.userId) {
            setError('You do not have permission to edit this post');
            return;
          }
          
          setPost(postData);
          setCaption(postData.caption || '');
          setLocation(postData.location || '');
          
          // Handle different media structures
          if (postData.mediaUrls && Array.isArray(postData.mediaUrls)) {
            setMediaUrls(postData.mediaUrls);
          } else if (postData.media && Array.isArray(postData.media)) {
            // Convert mixed media format to URLs
            const urls = postData.media.map(item => 
              typeof item === 'string' ? item : item.url
            );
            setMediaUrls(urls);
          }
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPost();
    }
  }, [id, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!post || !user) return;
    
    try {
      setUpdating(true);
      setError('');
      
      // Update post document
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        caption,
        location: location || null,
      });
      
      router.push(`/post/${id}`);
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post. Please try again.');
      setUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green"></div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 text-red-500 rounded-lg p-4 mb-4">
            {error}
          </div>
          <button
            onClick={() => router.back()}
            className="text-gtgram-green hover:underline"
          >
            Go back
          </button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 bg-white shadow-sm rounded-lg">
        <h1 className="text-2xl font-bold text-gtgram-dark mb-6">Edit Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Preview */}
          <div className="border border-gtgram-gray rounded-lg overflow-hidden">
            {mediaUrls.length > 0 && <ImageCarousel images={mediaUrls} />}
          </div>
          
          {/* Caption Input */}
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gtgram-dark mb-2">
              Caption
            </label>
            <textarea
              id="caption"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green"
              placeholder="Write a caption..."
            />
          </div>
          
          {/* Location Input */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gtgram-dark mb-2">
              Location (optional)
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green"
              placeholder="Add location"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gtgram-gray rounded-lg text-gtgram-dark font-medium hover:bg-gray-50 flex-1"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-gtgram-green hover:bg-gtgram-green/90 text-white rounded-lg font-medium flex-1"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
} 
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineClose } from 'react-icons/ai';
import { BiDotsHorizontalRounded } from 'react-icons/bi';
import { useDeletePost } from '@/lib/hooks/useFirebaseQuery';

interface PostActionsMenuProps {
  postId: string;
  userId: string;
  currentUserId: string | undefined;
  mediaUrls?: string[];
  onEditClick?: () => void;
}

export default function PostActionsMenu({ 
  postId, 
  userId, 
  currentUserId,
  mediaUrls = [],
  onEditClick 
}: PostActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Only show edit options for the post owner
  const isOwner = currentUserId === userId;
  
  // Hook for deleting posts
  const deletePost = useDeletePost();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEditClick = () => {
    setIsOpen(false);
    if (onEditClick) {
      onEditClick();
    } else {
      // Navigate to edit page if no callback provided
      router.push(`/post/edit/${postId}`);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePost.mutateAsync({ postId, mediaUrls });
      setIsOpen(false);
      setShowConfirmation(false);
      router.push('/home');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
  };

  if (!isOwner) {
    return null; // Return nothing if not the post owner
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gtgram-dark hover:text-gtgram-green transition-colors"
        aria-label="Post options"
      >
        <BiDotsHorizontalRounded size={22} />
      </button>
      
      {/* Dropdown menu */}
      {isOpen && !showConfirmation && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gtgram-gray z-50 w-48">
          <div className="py-1">
            <button 
              onClick={handleEditClick}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gtgram-dark hover:bg-gray-100"
            >
              <AiOutlineEdit className="mr-2" />
              Edit post
            </button>
            <button 
              onClick={handleDeleteClick}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
            >
              <AiOutlineDelete className="mr-2" />
              Delete post
            </button>
          </div>
        </div>
      )}
      
      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Post?</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. The post will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
              >
                {deletePost.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
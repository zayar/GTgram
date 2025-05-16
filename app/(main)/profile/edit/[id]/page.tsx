'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';
import { User } from '@/types/user';
import { AiOutlineCamera } from 'react-icons/ai';
import placeholders from '@/lib/placeholders';

export default function EditProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    bio: '',
    website: '',
    gender: 'prefer-not-to-say'
  });
  
  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the user is authorized to edit this profile
  useEffect(() => {
    if (currentUser && id !== currentUser.uid) {
      router.push('/home');
    }
  }, [currentUser, id, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', id as string));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          
          setFormData({
            username: userData.username || '',
            fullName: userData.fullName || '',
            bio: userData.bio || '',
            website: userData.website || '',
            gender: userData.gender || 'prefer-not-to-say'
          });
          
          setProfileImage(userData.photoURL || null);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [id]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || loading) return;
    if (id !== currentUser.uid) {
      setError('You are not authorized to edit this profile');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userRef = doc(db, 'users', id as string);
      
      // Upload new profile image if selected
      let photoURL = profileImage;
      if (newProfileImage) {
        const imageRef = ref(storage, `users/${id}/profile-${Date.now()}`);
        const uploadResult = await uploadBytes(imageRef, newProfileImage);
        photoURL = await getDownloadURL(uploadResult.ref);
      }
      
      // Update user data in Firestore
      await updateDoc(userRef, {
        username: formData.username,
        fullName: formData.fullName,
        bio: formData.bio,
        website: formData.website,
        gender: formData.gender,
        photoURL
      });
      
      // Redirect back to profile page
      router.push(`/profile/${id}`);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-medium mb-8">Edit profile</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center space-x-8">
            <div className="relative w-24 h-24 rounded-full overflow-hidden group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Image 
                src={imagePreview || profileImage || placeholders.avatar} 
                alt="Profile Image" 
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <AiOutlineCamera size={24} />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg">{formData.username}</p>
              <button 
                type="button" 
                className="text-[#0095F6] font-medium text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change profile photo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-[#0095F6]"
            />
          </div>
          
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-[#0095F6]"
            />
          </div>
          
          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium mb-1">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-[#0095F6]"
            />
          </div>
          
          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={150}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-[#0095F6] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{formData.bio.length}/150</p>
          </div>
          
          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium mb-1">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-[#0095F6]"
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0095F6] hover:bg-[#1877F2] text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="text-white bg-transparent hover:bg-[#262626] font-medium py-2 px-6 rounded-lg border border-[#262626] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
} 
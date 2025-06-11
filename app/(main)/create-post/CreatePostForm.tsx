'use client';

import { useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AiOutlineLink } from 'react-icons/ai';
import { processFiles } from '@/lib/imageCompression';

// Dynamically import the MediaUploader component
const MediaUploader = lazy(() => import('@/components/post/MediaUploader'));

export default function CreatePostForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Product linking states
  const [showProductLink, setShowProductLink] = useState(false);
  const [productLink, setProductLink] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [creatorCode, setCreatorCode] = useState('');

  const handleMediaFilesChange = (files: File[]) => {
    setMediaFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    if (mediaFiles.length === 0) {
      setError('Please add at least one image or video');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);

      // Compress images before upload
      const processedFiles = await processFiles(mediaFiles);

      // Upload all media files
      const totalFiles = processedFiles.length;
      let completedFiles = 0;
      
      const uploadPromises = processedFiles.map(async (file, index) => {
        const fileRef = ref(storage, `posts/${user.uid}/${Date.now()}-${file.name}`);
        
        // Upload file
        await uploadBytes(fileRef, file);
        completedFiles++;
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
        
        // Get download URL
        return getDownloadURL(fileRef);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Determine media type - video if the first file is video, otherwise image
      const isVideo = processedFiles[0].type.startsWith('video/');
      
      // Create product info object if product link is provided
      const productInfo = showProductLink && productLink ? {
        link: productLink,
        name: productName,
        description: productDescription,
        creatorCode: creatorCode,
      } : null;

      // Create post document
      const postData = {
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL,
        caption,
        location: location || null,
        mediaUrls: uploadedUrls,
        mediaType: isVideo ? 'video' : 'image',
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
        productInfo,
      };

      await addDoc(collection(db, 'posts'), postData);
      
      router.push('/home');
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 bg-white shadow-sm rounded-lg">
      <h1 className="text-xl sm:text-2xl font-bold text-gtgram-dark mb-4 sm:mb-6">Create New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Media Upload Section */}
        <Suspense fallback={
          <div className="border-2 border-dashed border-gtgram-gray rounded-lg p-4 sm:p-8">
            <div className="flex flex-col items-center justify-center h-48 sm:h-64">
              <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-t-2 border-b-2 border-gtgram-green mb-4"></div>
              <p className="text-gtgram-dark text-sm sm:text-base">Loading uploader...</p>
            </div>
          </div>
        }>
          <MediaUploader onFilesChange={handleMediaFilesChange} maxFiles={10} maxSizeMB={1} />
        </Suspense>

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
            className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green text-sm sm:text-base resize-none"
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
            className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green text-sm sm:text-base"
            placeholder="Add location"
          />
        </div>
        
        {/* Product Link Toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setShowProductLink(!showProductLink)}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm border ${
              showProductLink 
                ? 'border-gtgram-green bg-gtgram-green bg-opacity-10 text-gtgram-green' 
                : 'border-gtgram-gray text-gtgram-dark'
            }`}
          >
            <AiOutlineLink size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="whitespace-nowrap">{showProductLink ? 'Remove Product Link' : 'Add Product Link'}</span>
          </button>
        </div>
        
        {/* Product Link Fields */}
        {showProductLink && (
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-gtgram-gray rounded-lg bg-gray-50">
            <h3 className="font-medium text-gtgram-dark text-sm sm:text-base">Product Information</h3>
            
            <div>
              <label htmlFor="productLink" className="block text-sm font-medium text-gtgram-dark mb-2">
                Product Link URL *
              </label>
              <input
                type="url"
                id="productLink"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green text-sm sm:text-base"
                placeholder="https://example.com/product"
                required={showProductLink}
              />
            </div>
            
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gtgram-dark mb-2">
                Product Name
              </label>
              <input
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green text-sm sm:text-base"
                placeholder="Enter product name"
              />
            </div>
            
            <div>
              <label htmlFor="productDescription" className="block text-sm font-medium text-gtgram-dark mb-2">
                Product Description
              </label>
              <textarea
                id="productDescription"
                rows={2}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green text-sm sm:text-base resize-none"
                placeholder="Describe the product..."
              />
            </div>
            
            <div>
              <label htmlFor="creatorCode" className="block text-sm font-medium text-gtgram-dark mb-2">
                Creator Code
              </label>
              <input
                type="text"
                id="creatorCode"
                value={creatorCode}
                onChange={(e) => setCreatorCode(e.target.value)}
                className="w-full px-3 py-2 border border-gtgram-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gtgram-green text-sm sm:text-base"
                placeholder="Enter creator code (optional)"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg break-words">{error}</div>
        )}

        {/* Upload Progress */}
        {loading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gtgram-green h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs sm:text-sm text-center text-gtgram-dark">
              Uploading: {uploadProgress}%
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || mediaFiles.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm sm:text-base ${
            loading || mediaFiles.length === 0
              ? 'bg-gtgram-green/50 cursor-not-allowed'
              : 'bg-gtgram-green hover:bg-gtgram-green/90'
          } text-white transition-colors`}
        >
          {loading ? 'Creating Post...' : 'Share Post'}
        </button>
      </form>
    </div>
  );
} 
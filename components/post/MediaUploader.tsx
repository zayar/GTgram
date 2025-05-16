'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { AiOutlineCloudUpload, AiOutlineDelete } from 'react-icons/ai';
import { processFiles } from '@/lib/imageCompression';
import ImageCarousel from './ImageCarousel';

interface MediaUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function MediaUploader({ 
  onFilesChange, 
  maxFiles = 10, 
  maxSizeMB = 1 
}: MediaUploaderProps) {
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up URLs on unmount or when mediaUrls changes
  useEffect(() => {
    return () => {
      mediaUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [mediaUrls]);

  // Call parent callback when mediaFiles changes
  useEffect(() => {
    onFilesChange(mediaFiles);
  }, [mediaFiles, onFilesChange]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Check if adding more would exceed the maximum
    if (mediaFiles.length + e.target.files.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} files`);
      return;
    }
    
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit for initial check
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only images and videos under 100MB are allowed.');
    }

    if (validFiles.length === 0) {
      setError('No valid files selected. Please select images or videos under 100MB.');
      return;
    }

    setError('');
    
    try {
      // Show compressing state
      setCompressing(true);
      
      // Process and compress files
      const processedFiles = await processFiles(validFiles, {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1920, // Limit width/height to 1920px
        useWebWorker: true,
        onProgress: (progress) => {
          console.log(`Compression progress: ${progress}%`);
        }
      });
      
      setMediaFiles(prev => [...prev, ...processedFiles]);
      
      // Create preview URLs
      const newUrls = processedFiles.map(file => URL.createObjectURL(file));
      setMediaUrls(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Error processing images. Please try again.');
    } finally {
      setCompressing(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (index: number) => {
    if (mediaUrls[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrls[index]);
    }
    
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    mediaUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setMediaFiles([]);
    setMediaUrls([]);
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-gtgram-gray rounded-lg p-8">
        {mediaUrls.length > 0 ? (
          <div className="space-y-4">
            <ImageCarousel images={mediaUrls} />
            
            {/* Thumbnails of uploaded images */}
            <div className="flex overflow-x-auto space-x-2 py-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                    {url.includes('video') ? (
                      <video 
                        src={url} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Image
                        src={url}
                        alt={`Media ${index + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    aria-label="Remove image"
                  >
                    <AiOutlineDelete size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gtgram-green hover:text-gtgram-green/80"
                disabled={compressing || mediaFiles.length >= maxFiles}
              >
                {mediaFiles.length >= maxFiles ? 'Max files reached' : 'Add More'}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-red-500 hover:text-red-600"
                disabled={compressing}
              >
                Clear All
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer h-64"
            onClick={() => !compressing && fileInputRef.current?.click()}
          >
            {compressing ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green mb-4"></div>
                <p className="text-gtgram-dark">Compressing images...</p>
              </>
            ) : (
              <>
                <AiOutlineCloudUpload className="w-16 h-16 text-gtgram-green mb-4" />
                <p className="text-gtgram-dark mb-2">Click to upload photos or videos</p>
                <p className="text-sm text-gray-500">Maximum file size: 100MB</p>
                <p className="text-xs text-gray-400 mt-1">Images will be compressed for optimal performance</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={compressing || mediaFiles.length >= maxFiles}
        />
      </div>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
} 
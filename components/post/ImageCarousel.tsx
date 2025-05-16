'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { AiOutlineLeft, AiOutlineRight, AiOutlinePlayCircle } from 'react-icons/ai';
import placeholders from '@/lib/placeholders';

interface ImageCarouselProps {
  images: string[];
  aspectRatio?: 'square' | 'video';
}

export default function ImageCarousel({ images, aspectRatio = 'square' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine if current media is a video
  const isVideo = (url: string) => {
    return url.includes('.mp4') || 
           url.includes('.mov') || 
           url.includes('.webm') || 
           url.includes('video');
  };

  // Filter out video URLs for preloading
  const imagesToPreload = images.filter(url => !isVideo(url));

  // Preload images
  useEffect(() => {
    // Preload current image and adjacent images first
    const preloadImagesInOrder = () => {
      // Start with current image, then next, then previous, then the rest
      const preloadOrder = [
        currentIndex,
        (currentIndex + 1) % imagesToPreload.length,
        (currentIndex - 1 + imagesToPreload.length) % imagesToPreload.length,
        ...Array.from({ length: imagesToPreload.length }, (_, i) => i)
          .filter(i => i !== currentIndex && 
                        i !== (currentIndex + 1) % imagesToPreload.length && 
                        i !== (currentIndex - 1 + imagesToPreload.length) % imagesToPreload.length)
      ];
      
      // Preload in order
      preloadOrder.forEach(index => {
        const imgUrl = imagesToPreload[index];
        if (imgUrl && !isVideo(imgUrl) && !preloadedImages.includes(imgUrl)) {
          const img = new window.Image();
          img.src = imgUrl;
          img.onload = () => {
            setPreloadedImages(prev => [...prev, imgUrl]);
          };
        }
      });
    };
    
    preloadImagesInOrder();
  }, [currentIndex, imagesToPreload, preloadedImages]);

  // Handle key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const handleImageError = (index: number) => {
    setImgError(prev => ({ ...prev, [index]: true }));
  };

  if (!images || images.length === 0) return null;
  
  if (images.length === 1) {
    const currentUrl = images[0];
    const currentIsVideo = isVideo(currentUrl);

    if (currentIsVideo) {
      return (
        <div className={`relative ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-[9/16]'} w-full bg-black`}>
          <video
            src={currentUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
            poster={placeholders.post}
          />
        </div>
      );
    }
    
    return (
      <div className={`relative ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-[9/16]'} w-full`}>
        <Image
          src={imgError[0] ? placeholders.post : currentUrl}
          alt="Post image"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          className="object-cover"
          onError={() => handleImageError(0)}
        />
      </div>
    );
  }

  const currentUrl = images[currentIndex];
  const currentIsVideo = isVideo(currentUrl);

  // Calculate adjacent image indexes for preloading
  const nextIndex = (currentIndex + 1) % images.length;
  const prevIndex = (currentIndex - 1 + images.length) % images.length;
  
  // Memoize className calculation for better performance
  const containerClassName = useMemo(() => {
    return `relative ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-[9/16]'} w-full group bg-black`;
  }, [aspectRatio]);
  
  return (
    <div 
      ref={carouselRef}
      className={containerClassName}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current Image or Video */}
      {currentIsVideo ? (
        <video
          ref={videoRef}
          src={currentUrl}
          controls
          playsInline
          className="w-full h-full object-contain"
          poster={placeholders.post}
        />
      ) : (
        <Image
          src={imgError[currentIndex] ? placeholders.post : currentUrl}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          className="object-cover"
          onError={() => handleImageError(currentIndex)}
        />
      )}

      {/* Hidden preload images for adjacent slides */}
      <div className="hidden">
        {!isVideo(images[nextIndex]) && (
          <Image 
            src={images[nextIndex]}
            alt="Preload next"
            width={1}
            height={1}
            priority
          />
        )}
        {!isVideo(images[prevIndex]) && (
          <Image 
            src={images[prevIndex]}
            alt="Preload previous"
            width={1}
            height={1}
            priority
          />
        )}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Previous image"
      >
        <AiOutlineLeft size={20} />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Next image"
      >
        <AiOutlineRight size={20} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {images.map((url, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-3' : 'bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 
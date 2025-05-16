'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FaTimes, FaShoppingCart, FaExternalLinkAlt, FaShare, FaBookmark, FaRegBookmark, FaTag } from 'react-icons/fa';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import Image from 'next/image';
import placeholders from '@/lib/placeholders';

interface Product {
  id: string;
  name: string;
  // Additional fields we might add later
  price?: string;
  originalPrice?: string;
  discount?: string;
  image?: string;
  url?: string; // URL for the shop link
  images?: string[]; // Multiple product images
}

interface ProductDetailsPanelProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailsPanel({ product, isOpen, onClose }: ProductDetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCollections, setShowCollections] = useState(false);
  
  // Sample collections
  const collections = [
    { id: 'col1', name: 'Favorites', count: 12 },
    { id: 'col2', name: 'Wish List', count: 8 },
    { id: 'col3', name: 'Gift Ideas', count: 5 }
  ];
  
  // Sample images array for the carousel if product doesn't have images
  const defaultImages = [
    product.image || placeholders.product,
    placeholders.product + '?view=2',
    placeholders.product + '?view=3'
  ];
  
  const images = product.images || (product.image ? [product.image, ...defaultImages.slice(1)] : defaultImages);

  // Sample recommendations
  const recommendations = [
    {
      id: 'rec1',
      name: 'Similar Product 1',
      price: '฿120.00',
      image: placeholders.product + '?similar=1'
    },
    {
      id: 'rec2',
      name: 'Similar Product 2',
      price: '฿99.50',
      image: placeholders.product + '?similar=2'
    },
    {
      id: 'rec3',
      name: 'Similar Product 3', 
      price: '฿149.99',
      image: placeholders.product + '?similar=3'
    }
  ];

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle opening the shop link
  const handleShopClick = () => {
    if (product.url) {
      window.open(product.url, '_blank');
    }
  };
  
  // Handle image navigation
  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };
  
  // Handle share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product.name} on GTgram`,
        text: `Check out this product: ${product.name}`,
        url: product.url || window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      if (product.url) {
        navigator.clipboard.writeText(product.url)
          .then(() => alert('Link copied to clipboard!'))
          .catch(err => console.error('Error copying link:', err));
      }
    }
  };

  // Handle save to collection
  const handleSaveToCollection = (collectionId: string) => {
    console.log(`Saved product ${product.id} to collection ${collectionId}`);
    setSaved(true);
    setShowCollections(false);
  };
  
  // Handle creating new collection
  const handleCreateCollection = () => {
    // Here you would implement the logic to create a new collection
    alert('Create new collection functionality would be implemented here');
    setShowCollections(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-end justify-center">
      <div 
        ref={panelRef}
        className="bg-white rounded-t-xl w-full max-w-md animate-slideUp flex flex-col"
        style={{ 
          height: '80vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Header with close button and product name prominently displayed */}
        <div className="flex justify-between items-center p-4 border-b border-gtgram-gray bg-white">
          <h2 className="text-lg font-bold text-gtgram-dark">{product.name}</h2>
          <button 
            onClick={onClose}
            className="bg-gtgram-gray bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-colors"
          >
            <FaTimes className="text-gtgram-dark" />
          </button>
        </div>

        {/* Product details */}
        <div className="p-4 overflow-y-auto flex-grow bg-white">
          {/* Product image carousel */}
          <div className="mb-6 relative h-72 w-full bg-white rounded-lg border border-gtgram-gray">
            {/* Current image */}
            <div className="relative h-full w-full">
              <Image 
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={`${product.name} - view ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain"
              />
            </div>
            
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-sm"
                >
                  <IoChevronBackOutline size={24} className="text-gtgram-green" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-sm"
                >
                  <IoChevronForwardOutline size={24} className="text-gtgram-green" />
                </button>
              </>
            )}
            
            {/* Dots indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                {images.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-2 w-2 rounded-full ${index === currentImageIndex ? 'bg-gtgram-green' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCollections(true)}
                className="p-2 hover:bg-gtgram-green hover:bg-opacity-10 rounded-full transition-colors"
              >
                {saved ? 
                  <FaBookmark size={20} className="text-gtgram-green" /> : 
                  <FaRegBookmark size={20} className="text-gtgram-green" />
                }
              </button>
              <button 
                onClick={handleShare}
                className="p-2 hover:bg-gtgram-green hover:bg-opacity-10 rounded-full transition-colors"
              >
                <FaShare size={20} className="text-gtgram-green" />
              </button>
            </div>
            <div className="text-sm text-gtgram-dark text-opacity-60">
              {saved ? 'Saved to collection' : 'Save for later'}
            </div>
          </div>

          {/* Price information */}
          <div className="mb-6">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gtgram-green mr-2">
                {product.price || '฿114.40'}
              </span>
              {product.originalPrice && (
                <span className="text-gtgram-dark text-opacity-60 line-through text-sm">
                  {product.originalPrice}
                </span>
              )}
            </div>
            {product.discount && (
              <span className="inline-block bg-gtgram-green bg-opacity-10 text-gtgram-green px-2 py-1 rounded text-sm mt-1">
                {product.discount}
              </span>
            )}
          </div>

          {/* Product description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gtgram-dark mb-2">Product Details</h3>
            <p className="text-gtgram-dark text-opacity-80">
              {product.name} - High quality product available now on GTgram Shop.
              This is just a demo description for the product details slide-up panel.
            </p>
          </div>
          
          {/* Product recommendations */}
          <div className="mb-6">
            <h3 className="font-semibold text-gtgram-dark mb-3">You may also like</h3>
            <div className="flex overflow-x-auto space-x-3 pb-2">
              {recommendations.map(rec => (
                <div key={rec.id} className="flex-shrink-0 w-24">
                  <div className="relative h-24 w-24 bg-white rounded-lg mb-1 border border-gtgram-gray">
                    <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm">
                      <FaTag className="text-gtgram-green" size={10} />
                    </div>
                    <Image
                      src={rec.image}
                      alt={rec.name}
                      fill
                      sizes="96px"
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-xs font-medium text-gtgram-dark truncate">{rec.name}</div>
                  <div className="text-xs text-gtgram-green">{rec.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-auto">
            <button className="flex-1 border border-gtgram-gray text-gtgram-dark py-3 rounded-lg font-medium hover:bg-gtgram-green hover:bg-opacity-5 transition-colors">
              Add to Cart
            </button>
            <button className="flex-1 bg-gtgram-green text-white py-3 rounded-lg font-medium hover:bg-gtgram-light-green transition-colors">
              Buy Now
            </button>
          </div>
        </div>

        {/* Shop link at the bottom - more prominent with product name */}
        {product.url && (
          <div 
            onClick={handleShopClick}
            className="p-4 bg-gtgram-green bg-opacity-10 text-gtgram-dark flex items-center cursor-pointer rounded-b-xl hover:bg-opacity-20 transition-colors"
          >
            <div className="bg-white p-2 rounded-md mr-3 border border-gtgram-gray shadow-sm">
              <FaTag className="text-gtgram-green" size={20} />
            </div>
            <div className="flex-grow">
              <div className="flex flex-col">
                <span className="font-bold text-sm">Shop This Product</span>
                <span className="text-sm text-gtgram-dark text-opacity-60">{product.name}</span>
              </div>
            </div>
            <FaExternalLinkAlt size={14} className="text-gtgram-green" />
          </div>
        )}
      </div>
      
      {/* Collections modal */}
      {showCollections && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="border-b border-gtgram-gray p-4">
              <h3 className="text-lg font-semibold text-center text-gtgram-dark">Save to Collection</h3>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {/* List of collections */}
              <div className="space-y-3">
                {collections.map(collection => (
                  <div 
                    key={collection.id}
                    onClick={() => handleSaveToCollection(collection.id)}
                    className="flex items-center p-3 rounded-lg hover:bg-gtgram-green hover:bg-opacity-5 cursor-pointer"
                  >
                    <div className="h-12 w-12 bg-gtgram-green bg-opacity-10 rounded-md mr-3 flex items-center justify-center">
                      <FaRegBookmark size={18} className="text-gtgram-green" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gtgram-dark">{collection.name}</div>
                      <div className="text-xs text-gtgram-dark text-opacity-60">{collection.count} items</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Create new collection button */}
              <button
                onClick={handleCreateCollection}
                className="mt-4 w-full py-3 border border-gtgram-gray rounded-lg text-center font-medium text-gtgram-dark hover:bg-gtgram-green hover:bg-opacity-5 transition-colors"
              >
                Create New Collection
              </button>
            </div>
            
            <div className="border-t border-gtgram-gray p-3">
              <button
                onClick={() => setShowCollections(false)}
                className="w-full py-2 text-center text-gtgram-green font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
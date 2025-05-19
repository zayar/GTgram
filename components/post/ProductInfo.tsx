'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RiShoppingBagFill } from 'react-icons/ri';
import { IoIosArrowForward } from 'react-icons/io';

interface ProductInfoProps {
  productInfo: {
    link: string;
    name?: string;
    description?: string;
    price?: string;
    creatorCode?: string;
  };
  onProductClick?: () => void;
}

export default function ProductInfo({ productInfo, onProductClick }: ProductInfoProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!productInfo || !productInfo.link) return null;

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick();
    }
  };
  
  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    setExpanded(!expanded);
  };
  
  return (
    <div 
      className="mt-2 border border-gtgram-gray rounded-lg overflow-hidden cursor-pointer"
      onClick={handleProductClick}
    >
      <div className="flex items-center justify-between p-3 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="mr-2">
            <RiShoppingBagFill className="text-gtgram-green" size={22} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{productInfo.name}</h4>
            <div className="text-sm text-gray-500">{productInfo.price}</div>
          </div>
        </div>
        
        <button
          onClick={handleExpandToggle}
          className="p-2"
          aria-label={expanded ? "Collapse product details" : "Expand product details"}
        >
          <IoIosArrowForward 
            className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
            size={16}
          />
        </button>
      </div>
      
      {expanded && (productInfo.description || productInfo.creatorCode) && (
        <div className="p-3 bg-white border-t border-gtgram-gray">
          {productInfo.description && (
            <p className="text-sm text-gray-600 mb-2">{productInfo.description}</p>
          )}
          {productInfo.creatorCode && (
            <div className="mt-1">
              <p className="text-xs font-medium text-gtgram-dark">Creator Code:</p>
              <p className="text-sm font-semibold text-gtgram-green">{productInfo.creatorCode}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
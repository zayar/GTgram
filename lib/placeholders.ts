// Placeholder image utilities

// Create base64 encoded SVG placeholders for better performance
const createSvgPlaceholder = (text: string, size = 150) => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#E0E0E0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size/10}" text-anchor="middle" fill="#666" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `.trim();
  
  // Convert to base64
  const base64 = typeof window === 'undefined' 
    ? Buffer.from(svg).toString('base64')
    : btoa(svg);
    
  return `data:image/svg+xml;base64,${base64}`;
};

// Generate all placeholder SVGs
const staticPlaceholders = {
  avatar: createSvgPlaceholder('User', 150),
  post: createSvgPlaceholder('Post', 500),
  product: createSvgPlaceholder('Product', 400),
  generic: createSvgPlaceholder('Image', 300),
};

// Default placeholder URLs for different use cases
const placeholders = {
  // User avatar placeholder
  avatar: staticPlaceholders.avatar,
  
  // Post image placeholder
  post: staticPlaceholders.post,
  
  // Product image placeholder
  product: staticPlaceholders.product,
  
  // Generic image placeholder
  generic: staticPlaceholders.generic,
};

/**
 * Get a placeholder image URL
 * @param type - The type of placeholder needed
 * @returns The URL to the placeholder image
 */
export function getPlaceholderImage(
  type: 'avatar' | 'post' | 'product' | 'generic' = 'generic'
): string {
  return placeholders[type];
}

/**
 * Create a fallback function to handle image loading errors
 * @param type - The type of placeholder to use
 * @returns A function to handle the error event
 */
export function createImageFallback(
  type: 'avatar' | 'post' | 'product' | 'generic' = 'generic'
) {
  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.currentTarget;
    imgElement.src = placeholders[type];
    imgElement.onerror = null; // Prevent infinite error loop
  };
}

export default placeholders; 
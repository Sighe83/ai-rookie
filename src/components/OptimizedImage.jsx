import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  fallback = null,
  onError = null,
  loading = 'lazy',
  placeholder = true,
  ...props 
}) => {
  const [imageState, setImageState] = useState('loading');
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate a placeholder based on alt text
  const generatePlaceholder = (altText) => {
    const initial = (altText?.charAt(0) || 'U').toUpperCase();
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#475569"/>
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#ffffff" text-anchor="middle">${initial}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Handle image load success
  const handleLoad = () => {
    setImageState('loaded');
  };

  // Handle image load error
  const handleError = (e) => {
    console.log('OptimizedImage error:', { src, fallback: !!fallback, alt });
    setImageState('error');
    if (onError) {
      onError(e);
    }
    
    // Set fallback image immediately and mark as loaded
    if (fallback) {
      console.log('Setting fallback image');
      setImageSrc(fallback);
      setImageState('loaded'); // Mark as loaded immediately for fallback
    } else {
      // Use placeholder as fallback
      console.log('Setting placeholder image');
      const placeholderSrc = generatePlaceholder(alt);
      setImageSrc(placeholderSrc);
      setImageState('loaded'); // Mark as loaded immediately for placeholder
    }
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    console.log('OptimizedImage useEffect:', { src, loading, fallback: !!fallback });
    
    if (!src) {
      // No src provided - use fallback immediately
      console.log('No src - using fallback immediately');
      if (fallback) {
        setImageSrc(fallback);
        setImageState('loaded');
      } else {
        const placeholderSrc = generatePlaceholder(alt);
        setImageSrc(placeholderSrc);
        setImageState('loaded');
      }
      return;
    }
    
    if (loading !== 'lazy') {
      console.log('Not lazy loading - setting src directly');
      setImageSrc(src);
      return;
    }

    console.log('Setting up lazy loading observer');
    const imgElement = imgRef.current;
    if (!imgElement) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('Image intersecting - loading src');
            setImageSrc(src);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { 
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    observerRef.current.observe(imgElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Show loading placeholder if enabled
  if (imageState === 'loading' && placeholder && !imageSrc) {
    return (
      <div 
        ref={imgRef}
        className={`bg-slate-600 animate-pulse flex items-center justify-center ${className}`}
        {...props}
      >
        <div className="text-slate-400 text-sm">Indlæser...</div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading={loading}
      {...props}
    />
  );
};

export default OptimizedImage;
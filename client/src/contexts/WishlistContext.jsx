import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { accessToken, authenticatedFetch } = useAuth();
  const [wishlist, setWishlist] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const wishlistArray = JSON.parse(savedWishlist);
        setWishlist(new Set(wishlistArray));
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist)));
  }, [wishlist]);

  const toggleWishlist = async (courseId) => {
    if (!courseId) return;

    setIsLoading(true);
    try {
      const isCurrentlyWishlisted = wishlist.has(courseId);
      
      if (isCurrentlyWishlisted) {
        // Remove from wishlist
        setWishlist(prev => {
          const newWishlist = new Set(prev);
          newWishlist.delete(courseId);
          return newWishlist;
        });
        
        // Optionally sync with backend
        if (accessToken) {
          try {
            await authenticatedFetch(buildApiUrl(`/api/wishlist/${courseId}`), {
              method: 'DELETE',
            });
          } catch (error) {
            console.error('Error removing from wishlist:', error);
            // Revert local state if backend fails
            setWishlist(prev => new Set([...prev, courseId]));
          }
        }
      } else {
        // Add to wishlist
        setWishlist(prev => new Set([...prev, courseId]));
        
        // Optionally sync with backend
        if (accessToken) {
          try {
            await authenticatedFetch(buildApiUrl(`/api/wishlist/${courseId}`), {
              method: 'POST',
            });
          } catch (error) {
            console.error('Error adding to wishlist:', error);
            // Revert local state if backend fails
            setWishlist(prev => {
              const newWishlist = new Set(prev);
              newWishlist.delete(courseId);
              return newWishlist;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isWishlisted = (courseId) => {
    return wishlist.has(courseId);
  };

  const getWishlistCount = () => {
    return wishlist.size;
  };

  const clearWishlist = () => {
    setWishlist(new Set());
    localStorage.removeItem('wishlist');
  };

  const value = {
    wishlist: Array.from(wishlist),
    toggleWishlist,
    isWishlisted,
    getWishlistCount,
    clearWishlist,
    isLoading
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

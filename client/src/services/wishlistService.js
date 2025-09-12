import { buildApiUrl } from '@/lib/utils.js';

export const wishlistService = {
  // Add course to wishlist
  async addToWishlist(courseId, accessToken) {
    const response = await fetch(buildApiUrl(`/api/wishlist/${courseId}`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to add course to wishlist');
    }

    return response.json();
  },

  // Remove course from wishlist
  async removeFromWishlist(courseId, accessToken) {
    const response = await fetch(buildApiUrl(`/api/wishlist/${courseId}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove course from wishlist');
    }

    return response.json();
  },

  // Get user's wishlist
  async getWishlist(accessToken) {
    const response = await fetch(buildApiUrl('/api/wishlist'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wishlist');
    }

    return response.json();
  },

  // Toggle wishlist status
  async toggleWishlist(courseId, isWishlisted, accessToken) {
    if (isWishlisted) {
      return this.removeFromWishlist(courseId, accessToken);
    } else {
      return this.addToWishlist(courseId, accessToken);
    }
  }
};

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Utility functions for handling image URLs and other common operations

/**
 * Get the full URL for an image, handling both Cloudinary and local storage URLs
 * @param {string} imageUrl - The image URL from the backend
 * @param {string} backendUrl - The backend base URL
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imageUrl, backendUrl) => {
  if (!imageUrl) return '';
  
  // If it's already a full URL (Cloudinary), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a local path, prepend the backend URL
  if (imageUrl.startsWith('/uploads/')) {
    return `${backendUrl}${imageUrl}`;
  }
  
  // If it's just a filename, assume it's in uploads
  if (!imageUrl.includes('/')) {
    return `${backendUrl}/uploads/${imageUrl}`;
  }
  
  return imageUrl;
};

/**
 * Format a date string to a readable format
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate initials from a name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - Initials (e.g., "JD")
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

/**
 * Build the full API URL for backend requests
 * @param {string} endpoint - The API endpoint (e.g., '/api/courses')
 * @returns {string} - The full API URL
 */
export const buildApiUrl = (endpoint) => {
  // Get the backend URL from environment or use a default
  const backendUrl = import.meta.env.VITE_API_URL || 'https://edutech-84ht.onrender.com';
  
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Return the full URL
  return `${backendUrl}/${cleanEndpoint}`;
};



import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Check if Cloudinary credentials are available
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                           process.env.CLOUDINARY_API_KEY && 
                           process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('Cloudinary credentials not found. File uploads will use local storage.');
}

// Fallback upload function for local storage
export const uploadToLocal = async (filePath, folder = 'uploads') => {
  try {
    const uploadsDir = path.join(process.cwd(), folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const fileName = `${Date.now()}-${path.basename(filePath)}`;
    const destPath = path.join(uploadsDir, fileName);
    
    // Copy file to uploads directory
    fs.copyFileSync(filePath, destPath);
    
    // Return a local URL (this will be relative to your backend)
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    throw new Error(`Failed to upload to local storage: ${error.message}`);
  }
};

// Enhanced cloudinary with fallback
export const uploadToCloudinary = async (filePath, options = {}) => {
  if (!hasCloudinaryConfig) {
    // Fallback to local storage
    const localUrl = await uploadToLocal(filePath, options.folder || 'uploads');
    return {
      secure_url: localUrl,
      public_id: path.basename(localUrl),
      url: localUrl
    };
  }
  
  try {
    return await cloudinary.uploader.upload(filePath, options);
  } catch (error) {
    console.error('Cloudinary upload failed, falling back to local storage:', error.message);
    const localUrl = await uploadToLocal(filePath, options.folder || 'uploads');
    return {
      secure_url: localUrl,
      public_id: path.basename(localUrl),
      url: localUrl
    };
  }
};

export default cloudinary;



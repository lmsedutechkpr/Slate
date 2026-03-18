'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SellerAvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  storeName: string;
  onUploadComplete?: (url: string) => void;
}

export default function SellerAvatarUpload({
  userId,
  currentUrl: initialUrl,
  storeName,
  onUploadComplete
}: SellerAvatarUploadProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const initials = storeName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `sellers/${userId}/logo-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('seller-storage')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage bucket "seller-storage" not configured. Contact support.');
        } else {
          toast.error('Upload failed: ' + uploadError.message);
        }
        return;
      }

      // Get public URL
      const { data } = supabase.storage.from('seller-storage').getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('seller_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', userId);

      if (dbError) throw dbError;

      setCurrentUrl(data.publicUrl);
      onUploadComplete?.(data.publicUrl);
      toast.success('Store logo updated successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-24 h-24 mx-auto group">
      {/* Store Logo Display - Square */}
      <div className="w-24 h-24 rounded-2xl bg-[#F5F5F7] border border-[rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center">
        {currentUrl ? (
          <img src={currentUrl} alt="Store logo" className="w-full h-full object-cover" />
        ) : (
          <span className="font-[DM_Sans] font-extrabold text-[32px] text-[#AEAEB2]">
            {initials}
          </span>
        )}
      </div>

      {/* Hover Overlay */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center transition-opacity cursor-pointer ${
          uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <>
            <Camera className="w-5 h-5 text-white" />
            <span className="text-[10px] font-medium text-white mt-0.5">Edit</span>
          </>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}

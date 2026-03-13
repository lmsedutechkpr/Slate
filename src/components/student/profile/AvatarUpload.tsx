'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  fullName: string;
}

export default function AvatarUpload({ userId, currentUrl: initialUrl, fullName }: AvatarUploadProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage bucket "avatars" not found in Supabase.');
        } else {
          toast.error('Upload failed: ' + uploadError.message);
        }
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId);

      if (dbError) throw dbError;

      setCurrentUrl(data.publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update avatar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-20 h-20 mx-auto group">
      {/* Avatar Display */}
      <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-[24px] text-gray-500">{initials}</span>
        )}
      </div>

      {/* Hover Overlay */}
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center transition-opacity cursor-pointer ${
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

      {/* Hidden Input */}
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

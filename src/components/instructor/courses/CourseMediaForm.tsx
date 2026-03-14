'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';
import { createThumbnailUploadUrlAction } from '@/actions/curriculum';

interface Props {
  course: any;
  onUpdate: (d: any) => void;
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  setLastSaved: (d: Date) => void;
}

const inputCls = 'w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:border-[rgba(0,0,0,0.2)]';

export function CourseMediaForm({ course, onUpdate, setSaveStatus, setLastSaved }: Props) {
  const supabase = createClient();
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? '');
  const [promoUrl, setPromoUrl] = useState(course.promo_video_url ?? '');
  const [uploading, setUploading] = useState(false);

  const save = async (field: string, value: string) => {
    setSaveStatus('saving');
    onUpdate({ [field]: value });
    const { error } = await supabase.from('courses').update({ [field]: value }).eq('id', course.id);
    if (error) { setSaveStatus('error'); return; }
    setSaveStatus('saved');
    setLastSaved(new Date());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Max file size is 2MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'tmp';
    
    try {
      // 1. Get secure presigned upload URL from backend
      const uploadData = await createThumbnailUploadUrlAction(course.id, ext);
      
      // 2. Upload file directly to S3 via frontend (bypassing Next.js timeouts)
      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .uploadToSignedUrl(uploadData.path, uploadData.token, file);

      if (uploadError) throw new Error(uploadError.message);

      // 3. Save the public URL to course db
      setThumbnailUrl(uploadData.publicUrl);
      await save('thumbnail_url', uploadData.publicUrl);

    } catch (err: any) {
      console.error('Upload Error:', err.message);
      alert('Failed to upload thumbnail: ' + err.message);
    }
    
    setUploading(false);
  };

  return (
    <div>
      <h2 className="mb-6 font-sans text-[22px] font-bold text-[#1D1D1F]">Course Media</h2>

      {/* Thumbnail */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">Course Thumbnail</span>
        </div>
        <div className="p-6">
          <p className="mb-4 text-[12px] text-[#6E6E73]">Recommended: 1280×720px, JPG or PNG, under 2MB</p>

          {thumbnailUrl ? (
            <label className="group relative block cursor-pointer overflow-hidden rounded-2xl">
              <Image src={thumbnailUrl} alt="Thumbnail" width={800} height={450} className="max-h-[200px] w-full rounded-2xl object-cover" />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[13px] font-semibold text-white">Change thumbnail</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(0,0,0,0.15)] bg-[#F5F5F7] p-8 text-center transition-colors hover:border-[rgba(0,0,0,0.3)]">
              {uploading ? (
                <p className="text-[13px] text-[#6E6E73]">Uploading...</p>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-[#AEAEB2]" />
                  <p className="mt-3 text-[13px] text-[#6E6E73]">Drag & drop or click to upload</p>
                  <p className="mt-1 text-[11px] text-[#AEAEB2]">JPG, PNG up to 2MB</p>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-[12px] font-medium text-[#6E6E73]">Or paste image URL:</p>
            <input
              className={inputCls}
              value={thumbnailUrl}
              placeholder="https://..."
              onChange={(e) => setThumbnailUrl(e.target.value)}
              onBlur={() => thumbnailUrl && save('thumbnail_url', thumbnailUrl)}
            />
          </div>
        </div>
      </div>

      {/* Promo Video */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">Promo Video (Optional)</span>
        </div>
        <div className="p-6">
          <input
            className={inputCls}
            value={promoUrl}
            placeholder="https://youtube.com/..."
            onChange={(e) => setPromoUrl(e.target.value)}
            onBlur={() => save('promo_video_url', promoUrl)}
          />
          <p className="mt-2 text-[12px] text-[#6E6E73]">A short 1–3 minute preview shown on the course page</p>
        </div>
      </div>
    </div>
  );
}

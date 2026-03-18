# ✅ Seller Profile Layout + Avatar Upload Setup

## Changes Made

### 1. **Fixed Left Sidebar Layout** ✓
- Left column (Personal Info, Store Info cards) is now **sticky and fixed**
- Right column (form contents) is now **scrollable only**
- Better UX for long forms - sidebar always visible for navigation

### 2. **Seller Avatar Upload Component** ✓
**File Created**: `src/components/seller/profile/SellerAvatarUpload.tsx`

Features:
- **Square Logo** (24x24px) instead of circular avatar
- **Hover to Edit** - Camera icon appears on hover
- **Drag & Drop Ready** - Image upload with validation
- **Size Limits**: Max 5MB per image
- **Formats**: PNG, JPG, WebP, GIF, etc.
- **Storage**: Saves to Supabase `seller-storage` bucket
- **Database**: Updates `seller_profiles.avatar_url` automatically

### 3. **ProfilePageClient Updates** ✓
- Imported SellerAvatarUpload component
- Replaced static logo with interactive upload
- Fixed layout: outer `flex flex-col`, inner `flex flex-row`
- Right column: `flex-1 overflow-y-auto` for scrolling
- Left sidebar: `lg:sticky lg:top-6 lg:h-fit` for fixed position

---

## 🔧 Supabase Setup Required

### Step 1: Create Storage Bucket

**In Supabase Dashboard:**
1. Go to **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Fill in:
   - **Name**: `seller-storage`
   - **Public**: Toggle **ON** (so images are public)
   - Click **Create bucket**

### Step 2: Set Bucket Policies

**For Public Access:**
1. Click the bucket `seller-storage`
2. Click **Policies** tab
3. Click **New Policy** or edit existing
4. Set permissions:
   - **Authenticated users** can **SELECT** (read)
   - **Authenticated users** can **INSERT** (write)
   - **Authenticated users** can **UPDATE** (update)

**Or use this SQL in SQL Editor:**

```sql
-- Allow sellers to upload/update their own logos
CREATE POLICY "Sellers can upload own logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'seller-storage'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Sellers can update own logos"
  ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'seller-storage'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public read access to logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'seller-storage');
```

### Step 3: Update CORS (if needed)

If you get CORS errors:
1. Go to **Settings** → **API**
2. Scroll to **CORS Allowed Origins**
3. Add your domain:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

---

## 📋 How It Works

### Upload Flow

```
User clicks logo → File dialog opens
    ↓
Select image file → Validation (type, size)
    ↓
Upload to seller-storage/sellers/{userId}/logo-{timestamp}.ext
    ↓
Get public URL
    ↓
Save URL to seller_profiles.avatar_url
    ↓
Update UI with new logo ✓
```

### Files & Paths

```
Supabase bucket: seller-storage/
    ↓
    sellers/
        ↓
        {userId}/
            ↓
            logo-1234567890.jpg
            logo-1234567891.png
```

---

## ✨ Features

### For Sellers

- ✅ **Easy Upload**: Click logo to edit, hover shows camera icon
- ✅ **Instant Feedback**: Success/error toast notifications
- ✅ **Large Images**: Supports up to 5MB files
- ✅ **Responsive**: Works on mobile and desktop
- ✅ **Initials Fallback**: Shows store initials if no logo

### Technical

- ✅ **Automatic Save**: Saves to database on upload
- ✅ **Public URLs**: Images immediately viewable
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Type Safety**: Full TypeScript support
- ✅ **No Scroll Jank**: Fixed layout, smooth scrolling

---

## 🧪 Testing

### Test the Upload

1. Navigate to `/seller/profile`
2. Left sidebar shows:
   - Store logo (with camera icon on hover)
   - Store name
   - Stats cards
   - Navigation tabs
3. Hover over logo → Camera icon appears
4. Click logo → File picker opens
5. Select image → Uploads automatically
6. ✅ Logo updates with toast: "Store logo updated successfully!"

### Test the Layout

1. Personal Info tab → Fill long form
2. ✅ Right column scrolls
3. ✅ Left sidebar stays fixed
4. Switch tabs → Sidebar remains sticky
5. ✅ No jumping/layout shift

---

## 📝 Database Changes

**No database migration needed!** ✓

The `seller_profiles` table already has:
- `avatar_url` (TEXT, for storing image URL)

The upload component automatically updates this field.

---

## 🚀 Code Changes Summary

| File | Change | Type |
|------|--------|------|
| `ProfilePageClient.tsx` | Import SellerAvatarUpload, update layout | Modified |
| `SellerAvatarUpload.tsx` | NEW upload component | Created |

**Total Files Changed**: 2
**Total Lines of Code**: ~200 (new component)
**TypeScript Errors**: 0 ✓

---

## ⚠️ Common Issues & Fixes

### "Bucket not found" Error
**Fix**: Create `seller-storage` bucket in Supabase Storage section

### CORS Error on Upload
**Fix**: Add your domain to CORS Allowed Origins in API settings

### Image Not Showing
**Fix**: Make sure bucket is set to **Public**

### Upload Takes Too Long
**Fix**: File might be too large - keep under 5MB (component validates this)

---

## 🎯 Next Steps

1. ✅ Create `seller-storage` bucket in Supabase
2. ✅ Set bucket to Public
3. ✅ Configure CORS (if needed)
4. ✅ Test upload on `/seller/profile`
5. ✅ Verify logo saves to database

---

## 💾 What Gets Saved

**Supabase Storage** (`seller-storage` bucket):
```
sellers/
  {userId}/
    logo-1710512345.jpg  ← Image file
```

**Supabase Database** (`seller_profiles` table):
```
avatar_url: "https://xxxxx.supabase.co/storage/v1/object/public/seller-storage/sellers/{userId}/logo-1710512345.jpg"
```

---

## 📞 Support

If you see **"Bucket not found"** error:
1. The `seller-storage` bucket wasn't created in Supabase
2. Go to Storage → Create new bucket → Name it `seller-storage`
3. Set Public = ON
4. Try again

If image doesn't show after upload:
1. Check if the URL is public
2. Try refreshing the page
3. Check browser console for CORS errors

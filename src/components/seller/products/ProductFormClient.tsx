'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, X, Loader2, Check, Clock, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import TrafficLights from '@/components/auth/TrafficLights';

interface ProductFormClientProps {
  userId: string;
  sellerCommissionRate: number;
  categories: any[];
  product: any | null; // null = create mode
}

export default function ProductFormClient({ userId, sellerCommissionRate, categories, product }: ProductFormClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!product;

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Form State ---
  const [name, setName] = useState(product?.name || '');
  const [nameTa, setNameTa] = useState(product?.name_ta || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [description, setDescription] = useState(product?.description || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [tagsStr, setTagsStr] = useState((product?.related_course_tags || []).join(', '));

  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [discountedPrice, setDiscountedPrice] = useState(product?.discounted_price?.toString() || '');

  const [stockQty, setStockQty] = useState(product?.stock_qty?.toString() || '');
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.low_stock_threshold?.toString() || '5');
  const [sku, setSku] = useState(product?.sku || '');
  const [weight, setWeight] = useState(product?.weight_grams?.toString() || '');

  const [images, setImages] = useState<string[]>(product?.images || []);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Admin approval flow: new products default to 'draft'
  // Seller chooses to save as draft or submit for approval via buttons
  // Only admin can set 'active'.
  const [status, setStatus] = useState(product?.status || 'draft');

  // --- Slug Uniqueness Check ---
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const slugCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const checkSlugAvailability = async (targetSlug: string) => {
    if (!targetSlug || targetSlug === product?.slug) {
      setSlugError(null);
      setIsSlugAvailable(null);
      return;
    }

    setIsSlugChecking(true);
    setSlugError(null);
    setIsSlugAvailable(null);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSlugError('This slug is already taken');
        setIsSlugAvailable(false);
      } else {
        setIsSlugAvailable(true);
      }
    } catch (err) {
      console.error('Error checking slug:', err);
    } finally {
      setIsSlugChecking(false);
    }
  };

  const handleSlugChange = (val: string) => {
    const formatted = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(formatted);

    if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
    slugCheckTimeout.current = setTimeout(() => {
      checkSlugAvailability(formatted);
    }, 500);
  };

  // Computed Auto Slug
  const generatedSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Auto-check generated slug when name changes (only if user hasn't manually set a slug)
  useEffect(() => {
    if (!slug && generatedSlug) {
      if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
      slugCheckTimeout.current = setTimeout(() => {
        checkSlugAvailability(generatedSlug);
      }, 500);
    }
  }, [generatedSlug]);

  // Computed checks
  const numPrice = parseFloat(price);
  const numDiscount = discountedPrice ? parseFloat(discountedPrice) : numPrice;
  const validPrice = !isNaN(numPrice) && numPrice > 0;
  
  const platformFeeRate = 100 - sellerCommissionRate;
  const sellerEarnings = validPrice ? Math.floor(numDiscount * (sellerCommissionRate / 100)) : 0;
  
  const discountPercent = (validPrice && numDiscount < numPrice && numPrice > 0) 
    ? Math.round(((numPrice - numDiscount) / numPrice) * 100) 
    : 0;

  const checks = {
    name: name.trim().length > 0,
    desc: description.trim().length > 0,
    cat: !!categoryId,
    price: validPrice,
    image: images.length > 0,
    stock: stockQty !== '' && parseInt(stockQty) >= 0,
    slug: !slugError && (slug.trim() !== '' || generatedSlug !== ''),
  };
  const canSave = Object.values(checks).every(Boolean) && !isSlugChecking;

  // Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be less than 2MB');
    if (images.length >= 5) return toast.error('Max 5 images allowed');

    const toastId = toast.loading('Uploading image...');
    
    // Create a deterministic path for this store + timestamp
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message, { id: toastId });
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData.path);
      
    if (publicUrlData) {
      setImages(prev => [...prev, publicUrlData.publicUrl]);
      toast.success('Image added!', { id: toastId });
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 5) return toast.error('Max 5 images allowed');
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const saveProduct = async (statusOverride?: string) => {
    if (!canSave) return toast.error('Please complete all required fields');

    setLoading(true);

    const relatedTags = tagsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    const finalSlug = slug.trim() || generatedSlug;

    // Final slug uniqueness check before saving
    if (finalSlug !== product?.slug) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (existing) {
        setSlugError('This slug is already taken');
        setLoading(false);
        return toast.error('Slug is already taken. Please use a different name or edit the slug.');
      }
    }

    // Determine final status:
    // - If statusOverride is provided (from specific button), use it
    // - Seller can never set 'active' directly — only admin can
    // - Existing active products keep 'active' unless seller drafts them
    let finalStatus = statusOverride || status;
    if (isEdit && product.status === 'active' && finalStatus !== 'draft') {
      finalStatus = 'active'; // preserve admin-approved status
    }
    if (finalStatus === 'active' && !isEdit) {
      finalStatus = 'pending'; // safety: new products can never be active
    }

    const payload = {
      seller_id: userId,
      category_id: categoryId,
      name: name.trim(),
      name_ta: nameTa.trim() || null,
      slug: finalSlug,
      description: description.trim(),
      images,
      price: numPrice,
      discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
      stock_qty: parseInt(stockQty),
      low_stock_threshold: parseInt(lowStockThreshold),
      sku: sku.trim() || null,
      weight_grams: weight ? parseFloat(weight) : null,
      status: finalStatus,
      related_course_tags: relatedTags,
    };

    if (!isEdit) {
      // Create
      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        toast.error('Failed to create product: ' + error.message);
      } else {
        const msg = finalStatus === 'draft' ? 'Product saved as draft!' : 'Product submitted for approval!';
        toast.success(msg);
        router.push('/seller/products');
      }
    } else {
      // Update
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', product.id)
        .eq('seller_id', userId);

      if (error) {
        toast.error('Failed to update product: ' + error.message);
      } else {
        toast.success('Product updated!');
        router.push('/seller/products');
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product? This action cannot be undone.')) return;
    setLoading(true);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('seller_id', userId);

    setLoading(false);
    if (!error) {
      toast.success('Product deleted');
      router.push('/seller/products');
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* HEADER — sticky */}
      <div className="sticky top-0 z-20 mb-6 flex items-center gap-4 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 shadow-sm">
        <button
          onClick={() => router.push('/seller/products')}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7] transition-colors hover:bg-[rgba(0,0,0,0.08)]"
        >
          <ArrowLeft className="h-4 w-4 text-[#1D1D1F]" />
        </button>
        <div className="flex-1">
          <h1 className="font-[DM_Sans] text-[20px] font-bold text-[#1D1D1F]">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
        {isEdit && product?.status === 'pending' && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#FFFBF2] px-3 py-1.5">
            <Clock className="h-3 w-3 text-[#FEBC2E]" />
            <span className="text-[11px] font-semibold text-[#FEBC2E]">Pending Approval</span>
          </div>
        )}
        {isEdit && product?.status === 'active' && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#EDFAF0] px-3 py-1.5">
            <ShieldCheck className="h-3 w-3 text-[#28C840]" />
            <span className="text-[11px] font-semibold text-[#28C840]">Live</span>
          </div>
        )}
        {isEdit && product?.status === 'draft' && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1.5">
            <span className="text-[11px] font-semibold text-[#AEAEB2]">Draft</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        
        {/* LEFT COLUMN: FORM */}
        <div className="flex-1 space-y-5">
          
          {/* Section 1: Info */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <TrafficLights size="sm" />
              <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Product Information
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                  Product Name <span className="text-[#FF5F57]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                  Product Name in Tamil (Optional)
                </label>
                <input
                  type="text"
                  value={nameTa}
                  onChange={e => setNameTa(e.target.value)}
                  placeholder="தமிழில் பெயர்"
                  className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#AEAEB2]">slate.dev/shop/</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      placeholder={generatedSlug || 'auto-generated-slug'}
                      className={`w-full rounded-xl border px-3 py-2 text-[13px] text-[#1D1D1F] focus:outline-none focus:ring-1 ${
                        slugError 
                          ? 'border-[#FF5F57] bg-[#FFF5F5] focus:ring-[#FF5F57]' 
                          : isSlugAvailable 
                            ? 'border-[#28C840] bg-[#F5FFF7] focus:ring-[#28C840]' 
                            : 'border-[rgba(0,0,0,0.1)] bg-[#F5F5F7]'
                      }`}
                    />
                    {isSlugChecking && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6E6E73]" />
                      </div>
                    )}
                  </div>
                </div>
                {slugError && (
                  <p className="mt-1 text-[11px] font-medium text-[#FF5F57]">{slugError}</p>
                )}
                {isSlugAvailable && !slugError && (
                  <p className="mt-1 text-[11px] font-medium text-[#28C840]">URL is available!</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                  Description <span className="text-[#FF5F57]">*</span>
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the product, its features and benefits..."
                  className="w-full resize-none rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] p-4 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    Category <span className="text-[#FF5F57]">*</span>
                  </label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] py-6 text-[14px] focus:bg-white data-[state=open]:bg-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[rgba(0,0,0,0.08)]">
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    Related Course Tags
                  </label>
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={e => setTagsStr(e.target.value)}
                    placeholder="e.g. React, Design..."
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                  />
                  <p className="mt-1 text-[11px] text-[#AEAEB2]">Shown to students enrolled in matching courses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <TrafficLights size="sm" />
              <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Pricing
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    Original Price (₹) <span className="text-[#FF5F57]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="1999"
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={discountedPrice}
                    onChange={e => setDiscountedPrice(e.target.value)}
                    placeholder="Leave empty for no sale"
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                  />
                  {discountPercent > 0 && (
                    <p className="mt-1 font-[DM_Sans] text-[12px] font-bold text-[#28C840]">
                      Students save {discountPercent}%
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] p-4 text-[13px]">
                <div className="mb-3">
                  <TrafficLights size="sm" />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#6E6E73]">Your Share ({sellerCommissionRate}%)</span>
                  <span className="font-semibold text-[#1D1D1F]">₹{sellerEarnings}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[rgba(0,0,0,0.06)] pb-2 mb-2">
                  <span className="text-[#6E6E73]">Platform Fee ({platformFeeRate}%)</span>
                  <span className="font-semibold text-[#1D1D1F]">₹{numDiscount - sellerEarnings || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1D1D1F]">Per unit earnings</span>
                  <span className="font-[DM_Sans] text-[16px] font-extrabold text-[#28C840]">₹{sellerEarnings}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Inventory */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <TrafficLights size="sm" />
              <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Inventory
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    Stock Quantity <span className="text-[#FF5F57]">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQty}
                    onChange={e => setStockQty(e.target.value)}
                    placeholder="50"
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={e => setLowStockThreshold(e.target.value)}
                    placeholder="5"
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                  />
                  <p className="mt-1 text-[11px] text-[#AEAEB2]">Alert when stock falls below this number</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="e.g. SONY-WH1000-BLK"
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                  />
                  <p className="mt-1 text-[11px] text-[#AEAEB2]">Your internal product code</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">
                    Weight in grams (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                  />
                  <p className="mt-1 text-[11px] text-[#AEAEB2]">Used for shipping estimates</p>
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: Images */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <div className="flex items-center">
                <TrafficLights size="sm" />
                <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                  Product Images <span className="text-[#FF5F57]">*</span>
                </span>
              </div>
              <span className="text-[11px] text-[#AEAEB2]">{images.length}/5</span>
            </div>
            <div className="p-6">
              
              <div className="grid grid-cols-3 gap-3">
                {/* Image Slots */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const url = images[i];
                  const isPrimary = i === 0;

                  return (
                    <div 
                      key={i} 
                      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 transition-all ${
                        isPrimary ? 'col-span-2 row-span-2' : 'col-span-1 border-[rgba(0,0,0,0.08)]'
                      } ${!url ? 'border-dashed border-[rgba(0,0,0,0.15)] bg-[#F5F5F7] hover:bg-gray-100' : 'border-transparent bg-white shadow-sm'}`}
                    >
                      {url ? (
                        <>
                          <img src={url} alt={`img-${i}`} className="h-full w-full object-cover" />
                          <button
                            onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1D1D1F] shadow-sm transition-transform hover:scale-110"
                            title="Remove image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {isPrimary && (
                            <div className="absolute bottom-2 left-2 rounded-lg bg-[#1D1D1F] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                              Primary
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-full w-full flex-col items-center justify-center text-[#AEAEB2] transition-colors hover:text-[#1D1D1F]"
                          disabled={loading}
                        >
                          <ImageIcon className={`mb-2 ${isPrimary ? 'h-8 w-8' : 'h-5 w-5'}`} />
                          <span className={`${isPrimary ? 'text-[13px]' : 'text-[10px]'} font-semibold font-[DM_Sans]`}>
                            {isPrimary ? 'Primary Image' : 'Add'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
              />

              <p className="mt-4 text-[11px] text-[#AEAEB2]">JPG, PNG up to 2MB each. First image is shown in catalog.</p>

              {/* URl Input Fallback */}
              <div className="mt-4 flex gap-2 border-t border-[rgba(0,0,0,0.04)] pt-4">
                <input
                  type="text"
                  placeholder="Or paste an image URL..."
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddImageUrl()}
                  className="flex-1 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                />
                <button
                  onClick={handleAddImageUrl}
                  className="rounded-xl bg-[#F5F5F7] px-4 font-[DM_Sans] text-[12px] font-bold text-[#1D1D1F] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
                >
                  Add
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW + PUBLISH */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-5">
          
          <div className="sticky top-6 space-y-5">
            
            {/* PREVIEW CARD */}
            <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
                <TrafficLights size="sm" />
                <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                  Preview
                </span>
              </div>
              <div className="p-4 bg-[#F5F5F7]">
                
                {/* Mini card mimicking shop */}
                <div className="rounded-2xl border border-[rgba(0,0,0,0.04)] bg-white p-3 shadow-md pointer-events-none select-none">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F5F5F7]">
                    {images[0] ? (
                      <img src={images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-[#AEAEB2]">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="line-clamp-2 font-[DM_Sans] text-[14px] font-bold leading-tight text-[#1D1D1F]">
                      {name || 'Product Name'}
                    </p>
                    <div className="mt-2 flex items-end gap-1.5">
                      {discountedPrice ? (
                        <>
                          <span className="font-[DM_Sans] text-[16px] font-extrabold text-[#1D1D1F]">₹{discountedPrice}</span>
                          <span className="mb-0.5 text-[11px] font-medium tracking-wide text-[#AEAEB2] line-through">₹{price || '0'}</span>
                        </>
                      ) : (
                        <span className="font-[DM_Sans] text-[16px] font-extrabold text-[#1D1D1F]">₹{price || '0'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-center text-[11px] text-[#AEAEB2]">How it looks in the shop</p>
              </div>
            </div>

            {/* PUBLISH CARD */}
            <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
                <TrafficLights size="sm" />
                <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                  Publish
                </span>
              </div>
              <div className="p-5 space-y-5">

                {/* Status — admin approval aware */}
                <div className="border-b border-[rgba(0,0,0,0.04)] pb-4">
                  {/* Current status display */}
                  {status === 'active' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[#28C840]" />
                          <span className="font-[DM_Sans] text-[13px] font-bold text-[#28C840]">Approved</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#6E6E73]">Visible in the shop. Toggle off to save as draft.</p>
                      </div>
                      <Switch
                        checked={true}
                        onCheckedChange={(c: boolean) => {
                          if (!c) setStatus('draft');
                        }}
                      />
                    </div>
                  ) : status === 'pending' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#FEBC2E]" />
                          <span className="font-[DM_Sans] text-[13px] font-bold text-[#FEBC2E]">Pending Approval</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#6E6E73]">Admin will review before it goes live.</p>
                      </div>
                      <Switch
                        checked={false}
                        disabled={true}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-[DM_Sans] text-[13px] font-bold text-[#AEAEB2]">Draft</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#6E6E73]">Not visible. Submit for review to go live.</p>
                      </div>
                      <Switch
                        checked={false}
                        onCheckedChange={(c: boolean) => {
                          if (c) setStatus('pending');
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div className="space-y-2.5 border-b border-[rgba(0,0,0,0.04)] pb-4">
                  {[
                    { key: 'name', label: 'Product name' },
                    { key: 'desc', label: 'Description' },
                    { key: 'cat', label: 'Category selected' },
                    { key: 'price', label: 'Price set' },
                    { key: 'image', label: 'At least 1 image' },
                    { key: 'stock', label: 'Stock qty set' },
                  ].map(({ key, label }) => {
                    const pass = (checks as any)[key];
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {pass ? <Check className="h-3.5 w-3.5 text-[#28C840]" /> : <X className="h-3.5 w-3.5 text-[#AEAEB2]" />}
                        <span className={`text-[12px] font-medium ${pass ? 'text-[#1D1D1F]' : 'text-[#AEAEB2]'}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!isEdit ? (
                  /* CREATE MODE: Two buttons — Draft + Submit */
                  <div className="space-y-2.5">
                    <button
                      onClick={() => saveProduct('pending')}
                      disabled={loading || !canSave}
                      className="flex w-full items-center justify-center rounded-full bg-[#1D1D1F] py-3.5 font-[DM_Sans] text-[14px] font-bold text-white transition-all hover:bg-black disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Submit for Approval
                    </button>
                    <button
                      onClick={() => saveProduct('draft')}
                      disabled={loading || !canSave}
                      className="flex w-full items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] bg-white py-3 font-[DM_Sans] text-[13px] font-semibold text-[#6E6E73] transition-all hover:bg-[#F5F5F7] disabled:opacity-50"
                    >
                      Save as Draft
                    </button>
                  </div>
                ) : (
                  /* EDIT MODE: Single save button */
                  <button
                    onClick={() => saveProduct()}
                    disabled={loading || !canSave}
                    className="flex w-full items-center justify-center rounded-full bg-[#1D1D1F] py-3.5 font-[DM_Sans] text-[14px] font-bold text-white transition-all hover:bg-black disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Product
                  </button>
                )}

                {isEdit && (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="block w-full text-center text-[12px] font-medium text-[#FF5F57] hover:underline"
                  >
                    Delete Product
                  </button>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

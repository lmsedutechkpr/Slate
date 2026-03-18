import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, AlertTriangle, Pencil, Copy, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function ProductRow({
  product,
  isSelected,
  onToggleSelect,
  onDuplicate,
  onDeleteRequest,
  onStatusChange,
  onOpenStockModal,
}: any) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Status toggle — seller can only:
  //   active → draft (take down)
  //   draft → pending (resubmit for review)
  // Pending products: no toggle allowed (waiting for admin)
  const handleStatusToggle = async (checked: boolean) => {
    // If currently active, toggling off → draft
    // If currently draft, toggling on → pending (submit for review)
    // If currently pending, toggle should be disabled (handled below)
    let newStatus: string;
    if (product.status === 'active' && !checked) {
      newStatus = 'draft';
    } else if (product.status === 'draft' && checked) {
      newStatus = 'pending';
    } else {
      return;
    }

    setLoadingStatus(true);
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', product.id);

    setLoadingStatus(false);
    if (!error) {
      const msg = newStatus === 'pending' ? 'Product submitted for approval' : `Product marked as ${newStatus}`;
      toast.success(msg);
      onStatusChange(product.id, newStatus);
    } else {
      toast.error('Failed to change status');
    }
  };

  const isLowStock = product.stock_qty <= (product.low_stock_threshold || 5) && product.stock_qty > 0;
  const isOut = product.stock_qty === 0;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: '#28C840', bg: '#EDFAF0' };
      case 'pending':
        return { label: 'Pending', color: '#FEBC2E', bg: '#FFFBF2' };
      case 'rejected':
        return { label: 'Rejected', color: '#FF5F57', bg: '#FFF0EF' };
      case 'draft':
        return { label: 'Draft', color: '#AEAEB2', bg: '#F5F5F7' };
      default:
        return { label: status, color: '#AEAEB2', bg: '#F5F5F7' };
    }
  };

  const statusInfo = getStatusInfo(product.status);

  return (
    <div className="grid grid-cols-[40px_minmax(200px,1.5fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_80px_100px] items-center gap-4 border-b border-[rgba(0,0,0,0.05)] bg-white px-5 py-3.5 transition-colors hover:bg-[#F5F5F7]">
      
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(product.id)} />
      </div>

      {/* Image + Name */}
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/150'}
          className="h-10 w-10 flex-shrink-0 cursor-pointer rounded-xl bg-[#F5F5F7] object-cover"
          onClick={() => router.push(`/seller/products/${product.id}/edit`)}
          alt=""
        />
        <div className="min-w-0">
          <p
            onClick={() => router.push(`/seller/products/${product.id}/edit`)}
            className="line-clamp-2 cursor-pointer font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F] transition-opacity hover:opacity-80"
          >
            {product.name}
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="min-w-0 flex items-center gap-2">
        <Package className="h-3 w-3 flex-shrink-0 text-[#AEAEB2]" />
        <span className="line-clamp-1 text-[12px] text-[#6E6E73]">
          {product.product_categories?.name || 'Uncategorized'}
        </span>
      </div>

      {/* Price */}
      <div>
        {product.discounted_price ? (
          <div>
            <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              ₹{product.discounted_price}
            </span>
            <span className="ml-1 text-[11px] text-[#AEAEB2] line-through">
              ₹{product.price}
            </span>
          </div>
        ) : (
          <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            ₹{product.price}
          </span>
        )}
      </div>

      {/* Stock (Clickable for modal) */}
      <div 
        className="flex cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-70"
        onClick={() => onOpenStockModal(product)}
        title="Click to quickly update stock"
      >
        {isOut ? (
          <>
            <span className="font-[DM_Sans] text-[13px] font-bold text-[#FF5F57]">0</span>
            <span className="rounded bg-[#FFF0EF] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FF5F57]">Out</span>
          </>
        ) : isLowStock ? (
          <>
            <span className="font-[DM_Sans] text-[13px] font-bold text-[#FEBC2E]">{product.stock_qty}</span>
            <AlertTriangle className="h-[10px] w-[10px] text-[#FEBC2E]" />
          </>
        ) : (
          <span className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">{product.stock_qty}</span>
        )}
      </div>

      {/* Sales */}
      <div>
        <span className="text-[13px] text-[#6E6E73]">{product.total_sold}</span>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        <div
          className="inline-flex w-fit items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
        >
          {statusInfo.label}
        </div>
        {product.status === 'active' && (
          <div className="flex items-center gap-1.5 px-0.5">
            <Switch
              checked={true}
              disabled={loadingStatus}
              onCheckedChange={handleStatusToggle}
              className="scale-[0.7] origin-left"
            />
            <span className="text-[10px] font-medium text-[#AEAEB2]">Live</span>
          </div>
        )}
        {product.status === 'draft' && (
          <div className="flex items-center gap-1.5 px-0.5">
            <Switch
              checked={false}
              disabled={loadingStatus}
              onCheckedChange={handleStatusToggle}
              className="scale-[0.7] origin-left"
            />
            <span className="text-[10px] font-medium text-[#AEAEB2]">Submit</span>
          </div>
        )}
        {product.status === 'pending' && (
          <span className="px-0.5 text-[10px] font-medium text-[#FEBC2E]">Awaiting review</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => router.push(`/seller/products/${product.id}/edit`)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#AEAEB2] hover:bg-black/5 hover:text-[#1D1D1F] transition-colors"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDuplicate(product)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#AEAEB2] hover:bg-black/5 hover:text-[#1D1D1F] transition-colors"
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDeleteRequest(product)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#AEAEB2] hover:bg-[#FF5F57]/10 hover:text-[#FF5F57] transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}

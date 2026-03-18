import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface RecentOrderRowProps {
  orderItem: any;
}

export default function RecentOrderRow({ orderItem }: RecentOrderRowProps) {
  const router = useRouter();

  const orderIdShort = orderItem.order_id.slice(0, 8).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(orderItem.created_at || orderItem.orders?.created_at), { addSuffix: true });
  
  const customerName = orderItem.orders?.profiles?.full_name || 'Guest User';
  const customerAvatar = orderItem.orders?.profiles?.avatar_url;
  const city = orderItem.orders?.addresses?.city || 'Unknown';

  const productImg = orderItem.products?.images?.[0] || 'https://via.placeholder.com/150';

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'processing': return <span className="inline-block rounded-full bg-[#FFF8EC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FEBC2E]">Processing</span>;
      case 'shipped': return <span className="inline-block rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1D1D1F]">Shipped</span>;
      case 'delivered': return <span className="inline-block rounded-full bg-[#EDFAF0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#28C840]">Delivered</span>;
      case 'cancelled': return <span className="inline-block rounded-full bg-[#FFF0EF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF5F57]">Cancelled</span>;
      default: return <span className="inline-block rounded-full bg-[#FFF8EC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FEBC2E]">Pending</span>;
    }
  };

  return (
    <div 
      onClick={() => router.push(`/seller/orders/${orderItem.order_id}`)}
      className="grid cursor-pointer grid-cols-[1fr_2fr_1.5fr_1fr_1fr] items-center border-b border-[rgba(0,0,0,0.05)] px-5 py-3 transition-colors hover:bg-[#F5F5F7] last:border-0"
    >
      {/* Col 1: Order */}
      <div>
        <p className="font-mono text-[12px] font-semibold text-[#1D1D1F]">#{orderIdShort}</p>
        <p className="mt-0.5 text-[11px] text-[#AEAEB2]">{timeAgo}</p>
      </div>

      {/* Col 2: Product */}
      <div className="flex items-center gap-2 pr-4">
        <img src={productImg} alt="" className="h-7 w-7 rounded-lg object-cover" />
        <p className="line-clamp-1 text-[12px] text-[#1D1D1F]">
          {orderItem.product_name}
        </p>
        <span className="ml-1 text-[11px] text-[#AEAEB2]">×{orderItem.quantity}</span>
      </div>

      {/* Col 3: Customer */}
      <div className="flex items-center gap-2 pr-4">
        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#F5F5F7]">
          {customerAvatar ? (
            <img src={customerAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-[#AEAEB2]">{customerName.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-1 text-[12px] text-[#6E6E73]">{customerName}</p>
          <p className="text-[11px] text-[#AEAEB2]">{city}</p>
        </div>
      </div>

      {/* Col 4: Amount */}
      <div>
        <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
          ₹{orderItem.total_price?.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Col 5: Status */}
      <div>
        {getStatusBadge(orderItem.fulfillment_status)}
      </div>
    </div>
  );
}

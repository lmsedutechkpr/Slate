import { useRouter } from 'next/navigation';

interface TopProductCardProps {
  product: any;
  rank: number;
}

export default function TopProductCard({ product, rank }: TopProductCardProps) {
  const router = useRouter();

  const imgUrl = product.images?.[0] || 'https://via.placeholder.com/150';
  const price = product.discounted_price || product.price || 0;
  const revenue = product.total_sold * price;

  return (
    <div
      onClick={() => router.push(`/seller/products/${product.id}`)}
      className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#F5F5F7] p-3 transition-colors hover:bg-[rgba(0,0,0,0.04)]"
    >
      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-white font-[DM_Sans] text-[11px] font-bold text-[#6E6E73]">
          #{rank}
        </div>
        <img
          src={imgUrl}
          alt={product.name}
          className="h-10 w-10 rounded-xl bg-white object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F]">
          {product.name}
        </p>
        <p className="mt-0.5 text-[11px] text-[#AEAEB2]">
          {product.total_sold} sold
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end">
        <p className="font-[DM_Sans] text-[13px] font-bold text-[#1D1D1F]">
          ₹{price.toLocaleString('en-IN')}
        </p>
        <p className="mt-0.5 text-[10px] text-[#AEAEB2]">
          ₹{revenue.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
}

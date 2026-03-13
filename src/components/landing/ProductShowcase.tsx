import Image from 'next/image';
import {Star} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import {Link} from '@/i18n/navigation';
import AddToCartButton from '@/components/landing/AddToCartButton';

type ProductRow = {
  id: string;
  name: string;
  name_ta: string | null;
  slug: string;
  images: string[] | null;
  price: number;
  discounted_price: number | null;
  avg_rating: number | null;
  total_reviews: number | null;
  stock_qty: number | null;
  low_stock_threshold: number | null;
};

export default async function ProductShowcase() {
  const t = await getTranslations('landing.products');

  try {
    const supabase = await createClient();
    const {data, error} = await supabase
      .from('products')
      .select(
        'id, name, name_ta, slug, images, price, discounted_price, avg_rating, total_reviews, stock_qty, low_stock_threshold, total_sold'
      )
      .eq('status', 'active')
      .order('total_sold', {ascending: false})
      .limit(4);

    if (error) throw error;
    if (!data?.length) return null;

    return (
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-24 md:grid-cols-[2fr,3fr] md:px-6">
        {/* Left text */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">SHOP</p>
          <h2 className="text-[30px] font-bold leading-tight text-[var(--text)]">{t('title')}</h2>
          <p className="mt-3 text-[14px] text-[var(--text-secondary)]">{t('subtitle')}</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full border border-[var(--border-hover)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[rgba(0,0,0,0.06)]"
          >
            {t('shopAll')}
          </Link>
        </div>

        {/* Right 2×2 grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {(data as unknown as ProductRow[]).map((product) => {
            const image = Array.isArray(product.images) ? product.images[0] : null;
            const outOfStock = (product.stock_qty ?? 0) <= 0;
            const lowStock =
              !outOfStock && (product.stock_qty ?? 0) <= (product.low_stock_threshold ?? 0);

            return (
              <article
                key={product.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                {/* Traffic light dots */}
                <div className="flex items-center gap-1">
                  <span className="h-[5px] w-[5px] rounded-full bg-[var(--traffic-red)]" />
                  <span className="h-[5px] w-[5px] rounded-full bg-[var(--traffic-yellow)]" />
                  <span className="h-[5px] w-[5px] rounded-full bg-[var(--traffic-green)]" />
                </div>

                {/* Image */}
                <div className="mt-3 h-[52px] w-[52px] overflow-hidden rounded-xl bg-[var(--surface-raised)]">
                  {image ? (
                    <Image
                      src={image}
                      alt={product.name}
                      width={52}
                      height={52}
                      loading="lazy"
                      className="h-[52px] w-[52px] object-contain"
                    />
                  ) : (
                    <div className="flex h-[52px] w-[52px] items-center justify-center text-lg font-semibold text-[var(--text-muted)]">
                      {(product.name ?? 'P').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <h3 className="mt-2 line-clamp-1 text-[13px] font-semibold text-[var(--text)]">{product.name}</h3>

                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star
                      key={i}
                      className="h-2.5 w-2.5"
                      fill={i < Math.floor(product.avg_rating ?? 0) ? '#FEBC2E' : 'none'}
                      color="#FEBC2E"
                    />
                  ))}
                  <span className="text-[var(--text-secondary)]">{(product.avg_rating ?? 0).toFixed(1)}</span>
                </div>

                <div className="mt-1">
                  {product.discounted_price ? (
                    <p className="text-[13px] font-bold text-[var(--text)]">
                      ₹{Number(product.discounted_price).toLocaleString()}
                      <span className="ml-1 text-[11px] text-[var(--text-muted)] line-through">
                        ₹{Number(product.price ?? 0).toLocaleString()}
                      </span>
                    </p>
                  ) : (
                    <p className="text-[13px] font-bold text-[var(--text)]">₹{Number(product.price ?? 0).toLocaleString()}</p>
                  )}
                </div>

                {lowStock ? (
                  <p className="mt-1 text-[11px] text-[var(--traffic-yellow)]">
                    {t('onlyLeft', {count: product.stock_qty ?? 0})}
                  </p>
                ) : null}
                {outOfStock ? <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{t('outOfStock')}</p> : null}

                <AddToCartButton productId={product.id} stockQty={product.stock_qty ?? 0} />
              </article>
            );
          })}
        </div>
      </section>
    );
  } catch (error) {
    console.error('ProductShowcase error', error);
    return null;
  }
}


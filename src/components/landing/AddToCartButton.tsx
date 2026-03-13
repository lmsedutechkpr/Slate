'use client';

import {useRouter} from 'next/navigation';
import {toast} from 'sonner';
import {createClient} from '@/lib/supabase/client';
import {useCartStore} from '@/store/useCartStore';
import {useTranslations} from 'next-intl';

export default function AddToCartButton({
  productId,
  stockQty
}: {
  productId: string;
  stockQty: number;
}) {
  const t = useTranslations('landing.products');
  const router = useRouter();
  const increment = useCartStore((state) => state.increment);

  const onClick = async () => {
    if (stockQty <= 0) return;

    const supabase = createClient();
    const {
      data: {user}
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?callbackUrl=/shop');
      return;
    }

    increment(1);

    const {data: existing} = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .is('variant_id', null)
      .maybeSingle();

    const quantity = (existing?.quantity ?? 0) + 1;

    const {error} = existing
      ? await supabase
          .from('cart_items')
          .update({quantity, updated_at: new Date().toISOString()})
          .eq('id', existing.id)
      : await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
          variant_id: null
        });

    if (error) {
      console.error('Add to cart error', error);
      return;
    }

    await supabase.from('user_events').insert({
      user_id: user.id,
      event_type: 'view_product',
      product_id: productId
    });

    toast.success(t('addedToCart'));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={stockQty <= 0}
      className="mt-2 w-full rounded-full bg-[var(--white-surface)] px-3 py-1 text-[11px] font-semibold text-[var(--white-text)] transition hover:bg-[rgba(0,0,0,0.8)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {stockQty <= 0 ? t('outOfStock') : t('addToCart')}
    </button>
  );
}

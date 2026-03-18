import { createClient as createAdmin } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = adminDb();

    // Step 1: Delete/unpublish all products
    await db
      .from('products')
      .update({ status: 'inactive' })
      .eq('seller_id', userId);

    // Step 2: Cancel all pending orders (update order items)
    const { data: orderItems } = await db
      .from('order_items')
      .select('order_id')
      .eq('seller_id', userId)
      .in('status', ['pending', 'processing', 'shipped']);

    if (orderItems && orderItems.length > 0) {
      const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];
      await db
        .from('orders')
        .update({ status: 'cancelled' })
        .in('id', orderIds);

      await db
        .from('order_items')
        .update({ status: 'cancelled' })
        .eq('seller_id', userId);
    }

    // Step 3: Delete seller profile
    await db
      .from('seller_profiles')
      .delete()
      .eq('user_id', userId);

    // Step 4: Delete user notifications related to this seller
    await db
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    // Step 5: Delete user profile
    await db
      .from('profiles')
      .delete()
      .eq('id', userId);

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}

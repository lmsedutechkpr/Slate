-- ============================================================
-- Fix: Notifications trigger on orders uses wrong column name
-- The trigger reads NEW.user_id but orders table uses customer_id
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Drop all existing triggers on the orders table
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'orders'
          AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON public.orders;';
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
    END LOOP;
END $$;

-- Step 2: Re-create a corrected trigger function using customer_id
CREATE OR REPLACE FUNCTION public.notify_on_order_placed()
RETURNS TRIGGER AS $$
BEGIN
    -- Use customer_id (the correct column) instead of user_id
    IF NEW.customer_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            is_read
        ) VALUES (
            NEW.customer_id,
            'order_placed',
            'Order Confirmed',
            'Your order has been placed successfully.',
            '/student/orders',
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Re-attach the trigger on orders
CREATE TRIGGER on_order_placed
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_order_placed();

-- Done! The trigger now correctly reads customer_id.

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface BulkActionsBarProps {
  selectedIds: string[];
  userId: string;
  onClear: () => void;
  onSuccess: () => void; // Trigger a refresh
}

export default function BulkActionsBar({ selectedIds, userId, onClear, onSuccess }: BulkActionsBarProps) {
  const supabase = createClient();
  const count = selectedIds.length;

  const handleBulkActivate = async () => {
    const toastId = toast.loading('Activating products...');
    const { error } = await supabase
      .from('products')
      .update({ status: 'active' })
      .in('id', selectedIds)
      .eq('seller_id', userId);
      
    if (error) {
      toast.error('Failed to activate products', { id: toastId });
    } else {
      toast.success(`${count} products activated!`, { id: toastId });
      onSuccess();
      onClear();
    }
  };

  const handleBulkDraft = async () => {
    const toastId = toast.loading('Drafting products...');
    const { error } = await supabase
      .from('products')
      .update({ status: 'draft' })
      .in('id', selectedIds)
      .eq('seller_id', userId);
      
    if (error) {
      toast.error('Failed to draft products', { id: toastId });
    } else {
      toast.success(`${count} products moved to draft!`, { id: toastId });
      onSuccess();
      onClear();
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${count} products? This action cannot be undone.`)) {
      return;
    }

    const toastId = toast.loading('Deleting products...');
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', selectedIds)
      .eq('seller_id', userId);

    if (error) {
      toast.error('Failed to delete products', { id: toastId });
    } else {
      toast.success(`${count} products deleted!`, { id: toastId });
      onSuccess();
      onClear();
    }
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
          className="fixed bottom-6 left-1/2 z-50 flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#1D1D1F] px-6 py-3.5 text-white shadow-2xl"
        >
          <div className="mr-2 flex items-center gap-1.5 opacity-80">
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
          </div>

          <span className="mr-4 font-[DM_Sans] text-[13px] font-semibold">
            {count} selected
          </span>

          <div className="flex gap-2 border-l border-[rgba(255,255,255,0.15)] pl-4">
            <button
              onClick={handleBulkActivate}
              className="rounded-full border border-[rgba(255,255,255,0.2)] px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium text-white transition-colors hover:bg-white hover:text-[#1D1D1F]"
            >
              Activate All
            </button>
            <button
              onClick={handleBulkDraft}
              className="rounded-full border border-[rgba(255,255,255,0.2)] px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium text-white transition-colors hover:bg-[rgba(255,255,255,0.1)]"
            >
              Draft All
            </button>
            <button
              onClick={handleBulkDelete}
              className="rounded-full border border-[#FF5F57]/40 px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium text-[#FF5F57] transition-colors hover:bg-[#FF5F57]/10"
            >
              Delete All
            </button>
          </div>

          <button
            onClick={onClear}
            className="ml-4 flex h-6 w-6 items-center justify-center rounded-full text-[#AEAEB2] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors"
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

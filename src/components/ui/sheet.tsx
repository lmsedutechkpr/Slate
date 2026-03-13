'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {cn} from '@/lib/utils';

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: Dialog.DialogContentProps & {side?: 'right' | 'left' | 'bottom'}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <Dialog.Content
        className={cn(
          'fixed z-50 bg-[#111111] p-6 shadow-2xl overflow-y-auto',
          side === 'right' ? 'h-full w-[84%] max-w-sm right-0 top-0 border-l border-[rgba(255,255,255,0.07)]' : 
          side === 'left' ? 'h-full w-[84%] max-w-sm left-0 top-0 border-r border-[rgba(255,255,255,0.07)]' : 
          'w-full bottom-0 left-0 border-t border-[rgba(255,255,255,0.07)] rounded-t-2xl max-h-[90vh]',
          className
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">Panel</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

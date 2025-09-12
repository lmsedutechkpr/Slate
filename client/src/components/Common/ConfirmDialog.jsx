import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ConfirmDialog = ({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  verifyText // optional: require user to type specific text to enable confirm
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) setValue('');
  }, [open]);

  const canConfirm = verifyText ? value === verifyText : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {verifyText && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Type <span className="font-semibold">{verifyText}</span> to confirm.</div>
            <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button onClick={() => { if (canConfirm) { onConfirm?.(); onOpenChange(false); } }} disabled={!canConfirm} variant={destructive ? 'destructive' : 'default'}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;



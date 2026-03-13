import {Eye, EyeOff} from 'lucide-react';
import {useState, forwardRef} from 'react';
import {cn} from '@/lib/utils';

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({className, ...props}, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={cn(
            'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] transition-all duration-150 placeholder:text-[var(--text-muted)] focus:border-[rgba(0,0,0,0.25)] focus:bg-[var(--surface)] focus:outline-none',
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

import {cn} from '@/lib/utils';
import {useEffect, useState} from 'react';

export function PasswordStrengthBar({password}: {password: string}) {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    if (!password) {
      setStrength(0);
      return;
    }
    if (password.length > 7) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    setStrength(score);
  }, [password]);

  const getColor = (index: number) => {
    if (strength === 0) return 'bg-[rgba(0,0,0,0.1)]';
    if (strength === 1) return index < 1 ? 'bg-[var(--traffic-red)]' : 'bg-[rgba(0,0,0,0.1)]';
    if (strength === 2 || strength === 3) return index < strength ? 'bg-[var(--traffic-yellow)]' : 'bg-[rgba(0,0,0,0.1)]';
    if (strength === 4) return index < 4 ? 'bg-[var(--traffic-green)]' : 'bg-[rgba(0,0,0,0.1)]';
    return 'bg-[rgba(0,0,0,0.1)]';
  };

  return (
    <div className="mt-2 flex gap-1">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="h-1 flex-1 overflow-hidden rounded-full break-inside-avoid">
          <div className={cn('h-full w-full transition-colors duration-300', getColor(index))} />
        </div>
      ))}
    </div>
  );
}

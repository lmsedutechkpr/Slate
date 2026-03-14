import {cn} from '@/lib/utils';

export default function TrafficLights({size = 'md'}: {size?: 'xs' | 'sm' | 'md' | 'lg'}) {
  const sizeMap = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  };

  const gapMap = {
    xs: 'gap-1',
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  };

  return (
    <div className={cn('flex items-center', gapMap[size])}>
      <span className={cn('rounded-full bg-[var(--traffic-red)]', sizeMap[size])} />
      <span className={cn('rounded-full bg-[var(--traffic-yellow)]', sizeMap[size])} />
      <span className={cn('rounded-full bg-[var(--traffic-green)]', sizeMap[size])} />
    </div>
  );
}

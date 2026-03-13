import {cn} from '@/lib/utils';
import {ReactNode} from 'react';
import TrafficLights from './TrafficLights';

interface SignupRoleCardProps {
  icon: ReactNode;
  title: string;
  tagline: string;
  points: string[];
  selected: boolean;
  requiresApproval?: boolean;
  requiresApprovalText?: string;
  onClick: () => void;
}

export function SignupRoleCard({
  icon,
  title,
  tagline,
  points,
  selected,
  requiresApproval,
  requiresApprovalText,
  onClick
}: SignupRoleCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex h-full cursor-pointer flex-col items-start gap-3 rounded-2xl border p-6 transition-all duration-200',
        selected
          ? 'border-[rgba(0,0,0,0.25)] bg-[var(--surface-raised)] outline outline-1 outline-[rgba(0,0,0,0.2)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:scale-[1.02] hover:border-[rgba(0,0,0,0.2)]'
      )}
    >
      <TrafficLights size="sm" />

      <div className="mt-4 rounded-xl bg-[rgba(0,0,0,0.06)] p-3 text-[var(--text)]">{icon}</div>

      <div>
        <h3 className="font-sans text-[17px] font-bold text-[var(--text)]">{title}</h3>
        <p className="text-[13px] text-[var(--text-secondary)]">{tagline}</p>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--traffic-green)]" />
            {point}
          </li>
        ))}
      </ul>

      {requiresApproval && (
        <span className="mt-1 rounded-full bg-[rgba(254,188,46,0.1)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--traffic-yellow)]">
          {requiresApprovalText}
        </span>
      )}
    </div>
  );
}

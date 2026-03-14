import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import TrafficLights from './TrafficLights';
import { Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignupRoleCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  points: string[];
  selected: boolean;
  requiresApproval?: boolean;
  requiresApprovalText?: string;
  onClick: () => void;
}

export function SignupRoleCard({
  icon,
  title,
  description,
  points,
  selected,
  requiresApproval,
  requiresApprovalText,
  onClick
}: SignupRoleCardProps) {
  return (
    <div className="flex flex-col">
      <div
        onClick={onClick}
        className={cn(
          'group flex cursor-pointer flex-col rounded-2xl border p-4 transition-all duration-200',
          selected
            ? 'border-[var(--text)] bg-[var(--surface-hover)] shadow-sm'
            : 'border-[var(--border)] bg-[var(--surface-raised)] hover:-translate-y-[2px] hover:border-[var(--border-hover)] hover:shadow-sm'
        )}
      >
        <div className="mb-3">
          <TrafficLights size="sm" />
        </div>

        <div className="mt-2 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-[var(--text)]">
            {icon}
          </div>

          <div className="flex-1">
            <h3 className="font-sans text-[15px] font-bold text-[var(--text)]">{title}</h3>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">{description}</p>

            <ul className="mt-2 flex flex-col gap-1.5">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <Check className="h-[11px] w-[11px] text-[var(--traffic-green)]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && requiresApproval && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 rounded-xl border border-[var(--traffic-yellow)]/20 bg-[var(--traffic-yellow)]/10 px-4 py-3">
              <Info className="mt-0.5 h-[14px] w-[14px] shrink-0 text-[var(--traffic-yellow)]" />
              <p className="text-[12px] leading-relaxed text-[var(--traffic-yellow)]">{requiresApprovalText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

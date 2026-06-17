import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="animate-fade-in flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
    {/* Icon container with layered background */}
    <div className="relative mb-5">
      <div className="absolute inset-0 scale-150 rounded-full bg-slate-100/60 blur-xl" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
    </div>

    <h3 className="text-base font-extrabold tracking-[-0.025em] text-slate-800">{title}</h3>
    {description && (
      <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-slate-400">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;

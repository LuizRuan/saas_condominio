import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Base shimmer
const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}
    aria-hidden="true"
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

// ─── Variants ────────────────────────────────────────────────────────────────

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 2,
  className = '',
}) => (
  <div className={`space-y-2.5 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`rounded-2xl border border-violet-100/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(76,29,149,0.06)] ${className}`}
    aria-hidden="true"
  >
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-xl" />
      </div>
    </div>
  </div>
);

export const SkeletonKpiGrid: React.FC<{ cols?: number }> = ({ cols = 3 }) => (
  <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-${cols}`}>
    {Array.from({ length: cols }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTableRow: React.FC = () => (
  <tr aria-hidden="true">
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-5 py-4">
        <Skeleton className={`h-4 ${i === 0 ? 'w-20' : i === 4 ? 'w-16' : 'w-full'} rounded-full`} />
      </td>
    ))}
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
    {/* Header */}
    <div className="border-b border-violet-50 bg-[#fbf8ff] px-5 py-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-xl" />
          <Skeleton className="h-3.5 w-52 rounded-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
    {/* Rows */}
    <table className="w-full" aria-hidden="true">
      <tbody className="divide-y divide-violet-50">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonPanel: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className = '',
}) => (
  <div
    className={`overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)] ${className}`}
    aria-hidden="true"
  >
    <div className="border-b border-violet-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-3 w-44 rounded-full" />
        </div>
      </div>
    </div>
    <div className="divide-y divide-violet-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    {/* Hero banner */}
    <Skeleton className="h-36 w-full rounded-3xl" />
    {/* KPI grid */}
    <SkeletonKpiGrid cols={3} />
    {/* Panels */}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <SkeletonPanel />
      <SkeletonPanel />
    </div>
  </div>
);

export const SkeletonPageHeader: React.FC = () => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-2">
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-4 w-72 rounded-full" />
    </div>
    <Skeleton className="h-10 w-36 rounded-xl" />
  </div>
);

export default Skeleton;

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface PricingCardProps {
  name: string;
  price: string;
  monthlyAmount: number;
  period: string;
  desc: string;
  items: string[];
  highlight: boolean;
  isAnnual: boolean;
  cta: React.ReactNode;
  badge?: string;
  badgeVariant?: 'popular' | 'current';
}

const PricingCard: React.FC<PricingCardProps> = ({
  name, price, monthlyAmount, period, desc, items, highlight, isAnnual, cta,
  badge, badgeVariant = 'popular',
}) => {
  const annualMonthlyStr = monthlyAmount > 0
    ? (monthlyAmount * 0.8).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;
  const annualTotalStr = monthlyAmount > 0
    ? (monthlyAmount * 0.8 * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  const displayPrice =
    price === 'Grátis' ? 'Grátis' :
    isAnnual && annualMonthlyStr ? `R$${annualMonthlyStr}` :
    price;

  const badgeClass =
    badgeVariant === 'current'
      ? highlight ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-700'
      : 'bg-white/20 text-white';

  return (
    <div className={`relative overflow-hidden rounded-3xl border p-7 ${
      highlight
        ? 'border-blue-500 bg-blue-600 text-white shadow-2xl shadow-blue-600/30'
        : 'border-slate-200 bg-white shadow-sm'
    }`}>
      {badge && (
        <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${badgeClass}`}>
          {badge}
        </div>
      )}

      <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${highlight ? 'text-blue-200' : 'text-blue-600'}`}>
        {name}
      </p>

      <div className="mt-3 flex flex-col items-start gap-0.5">
        <div className="flex items-end gap-1">
          <span className={`text-4xl font-extrabold tracking-[-0.05em] ${highlight ? 'text-white' : 'text-slate-950'}`}>
            {displayPrice}
          </span>
          {period && (
            <span className={`mb-1.5 text-sm font-semibold ${highlight ? 'text-blue-200' : 'text-slate-400'}`}>
              {period}
            </span>
          )}
        </div>
        {isAnnual && price !== 'Grátis' && annualTotalStr && (
          <span className={`text-xs font-medium ${highlight ? 'text-blue-200' : 'text-slate-400'}`}>
            {`faturado anualmente (R$${annualTotalStr})`}
          </span>
        )}
      </div>

      <p className={`mt-3 text-sm font-medium ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>
        {desc}
      </p>

      <ul className="my-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm font-semibold">
            <CheckCircle2 className={`h-4 w-4 shrink-0 ${highlight ? 'text-blue-200' : 'text-emerald-500'}`} />
            <span className={highlight ? 'text-white' : 'text-slate-700'}>{item}</span>
          </li>
        ))}
      </ul>

      {cta}
    </div>
  );
};

export default PricingCard;

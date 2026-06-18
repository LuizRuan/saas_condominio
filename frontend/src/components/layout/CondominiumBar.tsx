import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, CalendarDays, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Condominium } from '../../types';

const CondominiumBar: React.FC = () => {
  const { data: condo } = useQuery<Condominium | null>({
    queryKey: ['condominium-bar'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/condominiums/my');
        return data;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  if (!condo) return null;

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <div className="border-b border-slate-200/60 bg-white/60 px-4 py-2 backdrop-blur-md sm:px-6 lg:px-7">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-800">
          <Building2 className="h-4 w-4 text-violet-600" />
          <span className="font-extrabold">{condo.name || 'Meu Condomínio'}</span>
        </div>
        
        <div className="hidden h-3 w-[1px] bg-slate-300 sm:block" />
        
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-700">
            PLANO PRO
          </span>
        </div>

        <div className="hidden h-3 w-[1px] bg-slate-300 sm:block" />

        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Referência: {currentMonth}</span>
        </div>

        <div className="hidden h-3 w-[1px] bg-slate-300 sm:block" />

        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Sistema ativo</span>
        </div>
      </div>
    </div>
  );
};

export default CondominiumBar;

import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import DashboardCard from '../../components/dashboard/DashboardCard';
import DashboardPanel from '../../components/dashboard/DashboardPanel';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import PremiumPage from '../../components/ui/PremiumPage';
import { Receipt, Megaphone, AlertTriangle, CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react';
import api from '../../services/api';
import { ResidentDashboard as DashData } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ResidentDashboard: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { const { data } = await api.get('/dashboard/resident'); setData(data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage title="Meu Painel" subtitle="Bem-vindo ao Condomínio em Dia" onMenuClick={onMenuClick} eyebrow="Área do morador">
      <div className="mt-6 animate-fade-in space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-violet-900 px-6 py-8 text-white shadow-xl shadow-violet-950/15 sm:px-8">
          <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_70%_100%,rgba(167,139,250,0.22),transparent_34rem)]" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold text-blue-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Área do morador
            </div>
            <h2 className="text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Sua rotina condominial, sem complicação.</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-blue-100/75">
              Consulte cobranças, acompanhe ocorrências e organize suas reservas em um único lugar.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Cobranças pendentes" value={data?.stats.pendingCharges || 0} icon={<Receipt className="w-5 h-5" />} color="yellow" />
          <DashboardCard title="Comunicados" value={data?.stats.recentAnnouncements || 0} icon={<Megaphone className="w-5 h-5" />} color="blue" />
          <DashboardCard title="Ocorrências abertas" value={data?.stats.openIssues || 0} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
          <DashboardCard title="Próximas reservas" value={data?.stats.upcomingReservations || 0} icon={<CalendarDays className="w-5 h-5" />} color="purple" />
        </div>

        {data?.tasks?.length ? (
          <section className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
            <div className="border-b border-violet-100/80 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">O que precisa de você</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Atalhos para resolver pendências sem procurar menu.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-3">
              {data.tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate(task.link)}
                  className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50"
                >
                  <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-violet-700 ring-1 ring-violet-100">
                    {task.count} item(ns)
                  </span>
                  <h3 className="mt-3 text-sm font-black text-slate-950">{task.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{task.description}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DashboardPanel title="Próximas cobranças" subtitle="Valores pendentes da sua unidade" icon={<Receipt className="h-4 w-4" />}>
            {data?.pendingCharges?.length ? data.pendingCharges.map((charge) => (
              <div key={charge._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{charge.description}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Vence em {formatDate(charge.dueDate)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="mb-1.5 text-sm font-extrabold text-slate-950">{formatCurrency(charge.amount)}</p>
                  <StatusBadge status={charge.status} />
                </div>
              </div>
            )) : (
              <div className="flex min-h-32 flex-col items-center justify-center px-5 py-8 text-center">
                <CheckCircle2 className="mb-3 h-7 w-7 text-emerald-500" />
                <p className="text-sm font-bold text-slate-700">Nenhuma cobrança pendente</p>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Próximas reservas" subtitle="Agenda da sua unidade" icon={<CalendarDays className="h-4 w-4" />}>
            {data?.upcomingReservations?.length ? data.upcomingReservations.map((reservation) => (
              <div key={reservation._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{reservation.area}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(reservation.date)} · {reservation.startTime}–{reservation.endTime}</p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>
            )) : (
              <div className="flex min-h-32 flex-col items-center justify-center px-5 py-8 text-center">
                <CalendarDays className="mb-3 h-7 w-7 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Nenhuma reserva agendada</p>
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </PremiumPage>
  );
};
export default ResidentDashboard;

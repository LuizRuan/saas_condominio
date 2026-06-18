import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardCard from '../../components/dashboard/DashboardCard';
import DashboardPanel from '../../components/dashboard/DashboardPanel';
import RevenueChart from '../../components/dashboard/RevenueChart';
import OccupancyDonut from '../../components/dashboard/OccupancyDonut';
import IssuesTrendLine from '../../components/dashboard/IssuesTrendLine';
import StatusBadge from '../../components/ui/StatusBadge';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import PremiumPage from '../../components/ui/PremiumPage';
import {
  AlertCircle, AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2,
  ClipboardList, DollarSign, Home, Megaphone, TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatDate, getUnitLabel } from '../../utils/helpers';
import api from '../../services/api';
import { AdminDashboard as DashboardData, AuditLog } from '../../types';

interface ChartsData {
  revenue: { month: string; received: number; pending: number; late: number }[];
  issuesTrend: { month: string; open: number; resolved: number }[];
  occupancy: { occupied: number; empty: number; late: number; total: number };
}

const AdminDashboard: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const navigate = useNavigate();

  const { data: dashboardResponse, isLoading: loadingDashboard } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/admin');
      return data;
    },
  });
  const data = dashboardResponse ?? null;

  const { data: auditResponse, isLoading: loadingAudit } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await api.get('/audit', { params: { limit: 5 } });
      return data;
    },
  });
  const auditLogs = auditResponse ?? [];

  const { data: chartsResponse, isLoading: loadingCharts } = useQuery({
    queryKey: ['admin-charts'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/admin/charts');
      return data;
    },
  });
  const charts = chartsResponse ?? null;

  const loading = loadingDashboard || loadingAudit || loadingCharts;

  if (loading) {
    return (
      <PremiumPage title="Dashboard" subtitle="Visão geral do seu condomínio" onMenuClick={onMenuClick} eyebrow="Visão operacional">
        <div className="mt-6"><SkeletonDashboard /></div>
      </PremiumPage>
    );
  }

  return (
    <PremiumPage title="Dashboard" subtitle="Visão geral do seu condomínio" onMenuClick={onMenuClick} eyebrow="Visão operacional">
      <div className="mt-6 animate-fade-in space-y-6">

        {/* ── Hero banner ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-violet-900 px-6 py-8 text-white shadow-xl shadow-violet-950/15 sm:px-8">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-blue-400/15 blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_70%_100%,rgba(167,139,250,0.22),transparent_34rem)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-extrabold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Operação centralizada
              </div>
              <h2 className="max-w-2xl text-2xl font-extrabold tracking-[-0.045em] sm:text-3xl">
                Tudo o que importa, em uma visão clara.
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-400">
                Acompanhe financeiro, unidades e solicitações sem perder tempo alternando entre planilhas e mensagens.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-2xl border border-white/15 bg-white/[0.10] px-5 py-4 shadow-lg shadow-slate-950/10 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unidades</p>
                <p className="mt-1 text-xl font-extrabold">{data?.stats.totalUnits || 0}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.10] px-5 py-4 shadow-lg shadow-slate-950/10 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pendências</p>
                <p className="mt-1 text-xl font-extrabold">{(data?.stats.openIssues || 0) + (data?.stats.pendingReservations || 0)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardCard title="Recebido no mês" value={formatCurrency(data?.stats.receivedThisMonth || 0)} icon={<DollarSign className="w-5 h-5" />} color="green" />
          <DashboardCard title="A receber" value={formatCurrency(data?.stats.toReceive || 0)} icon={<TrendingUp className="w-5 h-5" />} color="blue" />
          <DashboardCard title="Em atraso" value={formatCurrency(data?.stats.late || 0)} icon={<AlertCircle className="w-5 h-5" />} color="red" />
          <DashboardCard title="Unidades" value={data?.stats.totalUnits || 0} icon={<Home className="w-5 h-5" />} color="slate" />
          <DashboardCard title="Ocorrências" value={data?.stats.openIssues || 0} icon={<AlertTriangle className="w-5 h-5" />} color="yellow" />
          <DashboardCard title="Reservas" value={data?.stats.pendingReservations || 0} icon={<CalendarDays className="w-5 h-5" />} color="purple" />
        </div>

        {/* ── Task center ── */}
        {data?.tasks?.length ? (
          <section className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
            <div className="border-b border-violet-100/80 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Central de tarefas</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Ações que merecem sua atenção agora.</p>
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
                    {task.count} pendência(s)
                  </span>
                  <h3 className="mt-3 text-sm font-black text-slate-950">{task.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{task.description}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Charts ── */}
        {charts && (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
              <OccupancyDonut
                occupied={charts.occupancy.occupied}
                empty={charts.occupancy.empty}
                late={charts.occupancy.late}
                total={charts.occupancy.total}
              />
              <RevenueChart data={charts.revenue} />
            </div>
            <IssuesTrendLine data={charts.issuesTrend} />
          </section>
        )}

        {/* ── Detail panels ── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DashboardPanel title="Cobranças atrasadas" subtitle="Valores que precisam de atenção" icon={<DollarSign className="h-4 w-4" />}>
            {data?.lateCharges && data.lateCharges.length > 0 ? (
              data.lateCharges.slice(0, 5).map((charge) => (
                <div key={charge._id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{getUnitLabel(charge.unitId)}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">Vencimento em {formatDate(charge.dueDate)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-1.5 text-sm font-extrabold text-red-600">{formatCurrency(charge.amount)}</p>
                    <StatusBadge status="late" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
                <CheckCircle2 className="mb-3 h-7 w-7 text-emerald-500" />
                <p className="text-sm font-bold text-slate-700">Nenhuma cobrança atrasada</p>
                <p className="mt-1 text-xs font-medium text-slate-400">O financeiro está em dia por aqui.</p>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Últimas ocorrências" subtitle="Solicitações abertas recentemente" icon={<AlertTriangle className="h-4 w-4" />}>
            {data?.recentIssues && data.recentIssues.length > 0 ? (
              data.recentIssues.slice(0, 5).map((issue) => (
                <div key={issue._id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{issue.title}</p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">{getUnitLabel(issue.unitId)} · {formatDate(issue.createdAt)}</p>
                  </div>
                  <StatusBadge status={issue.status} />
                </div>
              ))
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
                <CheckCircle2 className="mb-3 h-7 w-7 text-emerald-500" />
                <p className="text-sm font-bold text-slate-700">Nenhuma ocorrência aberta</p>
                <p className="mt-1 text-xs font-medium text-slate-400">As solicitações estão sob controle.</p>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Reservas pendentes" subtitle="Solicitações aguardando análise" icon={<CalendarDays className="h-4 w-4" />}>
            {data?.upcomingReservations && data.upcomingReservations.length > 0 ? (
              data.upcomingReservations.map((r) => (
                <div key={r._id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{r.area}</p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">{getUnitLabel(r.unitId)} · {formatDate(r.date)} · {r.startTime}–{r.endTime}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
                <CalendarDays className="mb-3 h-7 w-7 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Nenhuma reserva pendente</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Novas solicitações aparecerão aqui.</p>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Últimos comunicados" subtitle="Publicações recentes do condomínio" icon={<Megaphone className="h-4 w-4" />}>
            {data?.recentAnnouncements && data.recentAnnouncements.length > 0 ? (
              data.recentAnnouncements.map((a) => (
                <div key={a._id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{a.title}</p>
                      {a.isPinned && <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">Fixado</span>}
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(a.createdAt)}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
              ))
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
                <Megaphone className="mb-3 h-7 w-7 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Nenhum comunicado recente</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Suas publicações aparecerão aqui.</p>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Atividade recente" subtitle="Registro operacional do condomínio" icon={<ClipboardList className="h-4 w-4" />}>
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log._id} className="px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{log.message}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{log.actorName} · {formatDate(log.createdAt)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase text-violet-700 ring-1 ring-violet-100">
                      {log.entity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
                <ClipboardList className="mb-3 h-7 w-7 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Nenhuma atividade recente</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Ações relevantes aparecerão aqui.</p>
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </PremiumPage>
  );
};

export default AdminDashboard;

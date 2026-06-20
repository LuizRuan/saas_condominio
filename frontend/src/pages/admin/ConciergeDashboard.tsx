import React, { useState } from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import FilterSelect from '../../components/ui/FilterSelect';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  Users, Package as PackageIcon, AlertCircle, CalendarDays, Megaphone,
  LogOut, UserCircle2, Truck, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { Access, Announcement, Issue, Reservation, Resident } from '../../types';
import { getUnitLabel, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useDemo } from '../../contexts/DemoContext';

interface PkgData { _id: string; status: 'pending' | 'delivered'; }

const accessTypeLabels: Record<string, string> = {
  visitor: 'Visitante',
  service_provider: 'Prestador de Serviço',
  delivery: 'Entrega'
};

const ConciergeDashboard: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { isDemo, blockAction } = useDemo();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('active');

  const toArray = <T,>(raw: unknown): T[] => Array.isArray(raw) ? raw as T[] : (Array.isArray((raw as any)?.data) ? (raw as any).data : []);

  const { data: residents = [] } = useQuery<Resident[]>({
    queryKey: ['residents'],
    queryFn: async () => { const { data } = await api.get('/residents'); return toArray<Resident>(data); }
  });

  const { data: packages = [] } = useQuery<PkgData[]>({
    queryKey: ['packages'],
    queryFn: async () => { const { data } = await api.get('/packages'); return toArray<PkgData>(data); }
  });

  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ['issues'],
    queryFn: async () => { try { const { data } = await api.get('/issues'); return toArray<Issue>(data); } catch { return []; } }
  });

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['reservations'],
    queryFn: async () => { try { const { data } = await api.get('/reservations'); return toArray<Reservation>(data); } catch { return []; } }
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => { try { const { data } = await api.get('/announcements'); return toArray<Announcement>(data); } catch { return []; } }
  });

  const { data: accesses = [], isLoading: loadingAccesses } = useQuery<Access[]>({
    queryKey: ['accesses', filterStatus],
    queryFn: async () => {
      try {
        const { data } = await api.get('/access', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } });
        return toArray<Access>(data);
      } catch { return []; }
    }
  });

  const handleFinish = async (id: string) => {
    try {
      await api.patch(`/access/${id}/finish`);
      toast.success('Saída registrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['accesses'] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao registrar saída');
    }
  };

  const pendingPkgs = packages.filter(p => p.status === 'pending').length;
  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const recentAnnouncements = announcements.slice(0, 5);

  return (
    <PremiumPage
      title="Painel da Portaria"
      subtitle="Visão geral operacional do condomínio em tempo real."
      onMenuClick={onMenuClick}
    >
      {/* Metric Cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Moradores"
          value={residents.length}
          helper="Cadastrados no condomínio"
          icon={<Users className="h-4 w-4" />}
          iconClass="bg-blue-100 text-blue-700"
        />
        <MetricCard
          label="Encomendas Aguardando"
          value={pendingPkgs}
          helper="Aguardando retirada"
          icon={<PackageIcon className="h-4 w-4" />}
          iconClass="bg-amber-100 text-amber-700"
          valueClassName={pendingPkgs > 0 ? 'text-amber-600' : undefined}
        />
        <MetricCard
          label="Ocorrências Abertas"
          value={openIssues}
          helper="Em aberto ou em andamento"
          icon={<AlertCircle className="h-4 w-4" />}
          iconClass="bg-red-100 text-red-600"
          valueClassName={openIssues > 0 ? 'text-red-600' : undefined}
        />
        <MetricCard
          label="Reservas Pendentes"
          value={pendingReservations}
          helper="Aguardando aprovação"
          icon={<CalendarDays className="h-4 w-4" />}
          iconClass="bg-violet-100 text-violet-700"
        />
        <MetricCard
          label="Comunicados"
          value={announcements.length}
          helper="Publicados no condomínio"
          icon={<Megaphone className="h-4 w-4" />}
          iconClass="bg-indigo-100 text-indigo-700"
        />
      </section>

      {/* Comunicados Recentes */}
      {recentAnnouncements.length > 0 && (
        <section className="data-table-wrapper mt-6">
          <div className="data-table-header">
            <div>
              <h2 className="section-title">Comunicados Recentes</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">Últimas publicações do condomínio</p>
            </div>
            <NavLink to="/comunicados" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </NavLink>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentAnnouncements.map(a => (
              <li key={a._id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                </div>
                <p className="ml-4 shrink-0 text-xs font-medium text-slate-400">{formatDate(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Atividades de Acesso */}
      <section className="data-table-wrapper mt-6">
        <div className="data-table-header">
          <div>
            <h2 className="section-title">Atividades de Acesso</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Visitantes, prestadores e entregas no condomínio</p>
          </div>
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'active', label: 'Presentes' },
              { value: 'finished', label: 'Já saíram' },
              { value: 'all', label: 'Todos' }
            ]}
            className="w-44"
          />
        </div>

        {loadingAccesses ? (
          <div className="py-8"><LoadingSpinner text="Carregando..." /></div>
        ) : accesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">Nenhum registro encontrado</p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {filterStatus === 'active' ? 'Nenhum visitante presente no momento.' : 'Sem registros para este filtro.'}
            </p>
          </div>
        ) : (
          <div className="data-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Destino</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {accesses.map((access) => (
                  <tr key={access._id}>
                    <td>
                      <p className="font-bold text-slate-800">{access.visitorName}</p>
                      {access.documentNumber && (
                        <p className="mt-0.5 text-xs font-medium text-slate-400">Doc: {access.documentNumber}</p>
                      )}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ${
                        access.type === 'visitor' ? 'bg-blue-50 text-blue-700' :
                        access.type === 'delivery' ? 'bg-amber-50 text-amber-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {access.type === 'visitor' && <UserCircle2 className="h-3 w-3" />}
                        {access.type === 'delivery' && <PackageIcon className="h-3 w-3" />}
                        {access.type === 'service_provider' && <Truck className="h-3 w-3" />}
                        {accessTypeLabels[access.type]}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-700">{getUnitLabel(access.unitId) || 'Área Comum'}</td>
                    <td className="text-sm text-slate-500">{formatDate(access.entryTime)}</td>
                    <td className="text-sm text-slate-500">{access.exitTime ? formatDate(access.exitTime) : '—'}</td>
                    <td className="text-right">
                      {access.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => isDemo ? blockAction() : handleFinish(access._id)}
                          icon={<LogOut className="h-3.5 w-3.5" />}
                          className="hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          Dar saída
                        </Button>
                      ) : (
                        <StatusBadge status="resolved" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PremiumPage>
  );
};

export default ConciergeDashboard;

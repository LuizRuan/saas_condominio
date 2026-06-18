import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import PhotoGrid from '../../components/ui/PhotoGrid';
import { ImagePlus, Megaphone, Pin, ShieldCheck } from 'lucide-react';
import { categoryLabels, formatDate } from '../../utils/helpers';
import api from '../../services/api';
import { Announcement } from '../../types';

const ResidentAnnouncements: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [search, setSearch] = useState('');

  const { data: listResponse, isLoading: loading } = useQuery<{ data: Announcement[] }>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements', { params: { limit: 100 } });
      return data;
    },
  });
  const list: Announcement[] = listResponse?.data ?? (listResponse as unknown as Announcement[]) ?? [];

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list;

    return list.filter((announcement) => [
      announcement.title,
      announcement.message,
      categoryLabels[announcement.category],
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [list, search]);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Comunicados"
      subtitle="Acompanhe avisos e orientações importantes do condomínio."
      onMenuClick={onMenuClick}
      eyebrow="Área do morador"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar comunicados..."
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Comunicados" value={list.length} helper="publicados" icon={<Megaphone className="h-4 w-4" />} />
        <MetricCard label="Fixados" value={list.filter((item) => item.isPinned).length} helper="em destaque" icon={<Pin className="h-4 w-4" />} iconClass="bg-blue-100 text-blue-700" />
        <MetricCard label="Segurança" value={list.filter((item) => item.category === 'security').length} helper="alertas" icon={<ShieldCheck className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" />
        <MetricCard label="Fotos" value={list.reduce((total, item) => total + (item.photos?.length || 0), 0)} helper="anexadas" icon={<ImagePlus className="h-4 w-4" />} iconClass="bg-fuchsia-100 text-fuchsia-700" />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
        <div className="border-b border-violet-100/80 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Mural do Condomínio</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {search ? `${filteredAnnouncements.length} resultado(s) encontrados` : 'Publicações recentes para moradores'}
          </p>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
              <Megaphone className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              {list.length === 0 ? 'Nenhum comunicado disponível' : 'Nenhum comunicado encontrado'}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              {list.length === 0 ? 'Novos avisos aparecerão aqui.' : 'Tente buscar por outro título, categoria ou mensagem.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:p-7 xl:grid-cols-2">
            {filteredAnnouncements.map((announcement) => (
              <article key={announcement._id} className={`rounded-2xl border bg-white p-5 shadow-[0_14px_40px_rgba(76,29,149,0.05)] ${announcement.isPinned ? 'border-violet-300 ring-4 ring-violet-100/70' : 'border-violet-100/80'}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {announcement.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">
                      <Pin className="h-3.5 w-3.5" />
                      Fixado
                    </span>
                  )}
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                    {categoryLabels[announcement.category]}
                  </span>
                </div>
                <h3 className="text-base font-extrabold tracking-[-0.03em] text-slate-950">{announcement.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600">{announcement.message}</p>
                <PhotoGrid photos={announcement.photos} title={announcement.title} />
                <p className="mt-4 text-xs font-bold text-slate-400">{formatDate(announcement.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PremiumPage>
  );
};

export default ResidentAnnouncements;

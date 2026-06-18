import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Filter,
  ImagePlus,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { categoryLabels, formatDate } from '../../utils/helpers';
import api from '../../services/api';
import { Announcement } from '../../types';
import toast from 'react-hot-toast';

const catOptions = Object.entries(categoryLabels)
  .filter(([key]) => ['general', 'maintenance', 'assembly', 'security', 'financial'].includes(key))
  .map(([value, label]) => ({ value, label }));

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_TOTAL_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_MAX_DIMENSION = 700;
const PHOTO_QUALITY = 0.60;
const PAGE_SIZE = 4;

type CategoryFilter = 'all' | Announcement['category'];

const quickFilters: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'assembly', label: 'Assembleia' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'security', label: 'Segurança' },
];

const estimateDataUrlBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    const scale = Math.min(1, PHOTO_MAX_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível processar a imagem'));
      return;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(objectUrl);
    resolve(canvas.toDataURL('image/jpeg', PHOTO_QUALITY));
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Não foi possível carregar a imagem'));
  };

  image.src = objectUrl;
});

const getAuthorName = (announcement: Announcement) => (
  typeof announcement.createdBy === 'object' ? announcement.createdBy.name : 'João Síndico'
);

const getInitials = (name: string) => (
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JS'
);

const getExcerpt = (text: string, maxLength = 150) => (
  text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
);

interface AnnouncementCardActionsProps {
  announcement: Announcement;
  onCopy: (message: string) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
}

const AnnouncementCardActions: React.FC<AnnouncementCardActionsProps> = ({ announcement, onCopy, onEdit, onDelete }) => (
  <div className="flex shrink-0 items-center gap-1">
    <button type="button" onClick={() => onCopy(announcement.message)} className="icon-button" title="Copiar comunicado" aria-label={`Copiar ${announcement.title}`}>
      <Copy className="h-4 w-4" />
    </button>
    <button type="button" onClick={() => onEdit(announcement)} className="icon-button hover:text-violet-700" title="Editar comunicado" aria-label={`Editar ${announcement.title}`}>
      <Pencil className="h-4 w-4" />
    </button>
    <button type="button" onClick={() => onDelete(announcement)} className="icon-button hover:border-red-100 hover:bg-red-50 hover:text-red-600" title="Excluir comunicado" aria-label={`Excluir ${announcement.title}`}>
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

interface AnnouncementCardProps extends AnnouncementCardActionsProps {
  announcement: Announcement;
}

const FeaturedAnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, onCopy, onEdit, onDelete }) => {
  const coverPhoto = announcement.photos?.[0];
  const authorName = getAuthorName(announcement);

  return (
    <article className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white shadow-[0_18px_60px_rgba(76,29,149,0.08)]">
      {coverPhoto ? (
        <div className="relative h-64 overflow-hidden">
          <img src={coverPhoto} alt={announcement.title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-4">
            {announcement.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100/95 px-3 py-1 text-[11px] font-black text-red-600 shadow-sm">
                <Pin className="h-3.5 w-3.5" />
                Comunicado fixado
              </span>
            )}
            <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
              {categoryLabels[announcement.category]}
            </span>
            {(announcement.photos?.length || 0) > 1 && (
              <span className="ml-auto inline-flex rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                {announcement.photos.length} fotos
              </span>
            )}
          </div>
        </div>
      ) : null}

      <div className="p-5 sm:p-6">
        {!coverPhoto && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {announcement.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[11px] font-black text-red-600">
                <Pin className="h-3.5 w-3.5" />
                Fixado
              </span>
            )}
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
              {categoryLabels[announcement.category]}
            </span>
          </div>
        )}
        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-500">
          <CalendarDays className="h-4 w-4" />
          {formatDate(announcement.createdAt)}
        </div>
        <h3 className="text-2xl font-black tracking-[-0.045em] text-slate-950">{announcement.title}</h3>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{getExcerpt(announcement.message, 190)}</p>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-violet-50 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-200 to-violet-600 text-xs font-black text-white">
              {getInitials(authorName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-800">{authorName}</p>
              <p className="text-xs font-semibold text-slate-400">Síndico administrador</p>
            </div>
          </div>
          <AnnouncementCardActions announcement={announcement} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </article>
  );
};

const CompactAnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, onCopy, onEdit, onDelete }) => {
  const coverPhoto = announcement.photos?.[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white shadow-[0_16px_44px_rgba(76,29,149,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(76,29,149,0.1)]">
      {coverPhoto && (
        <img src={coverPhoto} alt={announcement.title} className="h-32 w-full object-cover" loading="lazy" />
      )}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
            {categoryLabels[announcement.category]}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(announcement.createdAt)}
          </span>
        </div>
        <h3 className="text-lg font-black leading-tight tracking-[-0.04em] text-slate-950">{announcement.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{getExcerpt(announcement.message, 130)}</p>
        <div className="mt-5 flex justify-end border-t border-violet-50 pt-3">
          <AnnouncementCardActions announcement={announcement} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </article>
  );
};

const AnnouncementsPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const queryClient = useQueryClient();
  
  const { data: listResponse, isLoading: loading } = useQuery<{ data: Announcement[] }>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements', { params: { limit: 100 } });
      return data;
    },
  });
  const list: Announcement[] = listResponse?.data ?? (listResponse as unknown as Announcement[]) ?? [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ title: '', message: '', category: 'general', isPinned: false, photos: [] as string[] });



  const openCreate = () => { setEditing(null); setForm({ title: '', message: '', category: 'general', isPinned: false, photos: [] }); setModalOpen(true); };
  const openEdit = (a: Announcement) => { setEditing(a); setForm({ title: a.title, message: a.message, category: a.category, isPinned: a.isPinned, photos: a.photos || [] }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title || !form.message) { toast.error('Título e mensagem são obrigatórios'); return; }
    if (processingPhotos) { toast.error('Aguarde o processamento das fotos'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/announcements/${editing._id}`, form); toast.success('Atualizado!'); }
      else { await api.post('/announcements', form); toast.success('Criado!'); }
      setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['announcements'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget._id;
    setSaving(true);
    try {
      await api.delete(`/announcements/${deletedId}`);
      toast.success('Comunicado excluído!');
      setDeleteTarget(null);
      if (editing?._id === deletedId) {
        setModalOpen(false);
        setEditing(null);
      }
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
    catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - form.photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Você pode adicionar no máximo ${MAX_PHOTOS} fotos`);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.error(`Só mais ${remainingSlots} foto(s) foram adicionadas`);
    }

    setProcessingPhotos(true);
    try {
      const newPhotos: string[] = [];
      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} tem mais de 8MB`);
          continue;
        }
        newPhotos.push(await compressImage(file));
      }

      setForm((currentForm) => {
        const nextPhotos = [...currentForm.photos, ...newPhotos];
        const totalSize = nextPhotos.reduce((total, photo) => total + estimateDataUrlBytes(photo), 0);
        if (totalSize > MAX_TOTAL_PHOTO_SIZE) {
          toast.error('As fotos ficaram muito grandes. Remova algumas imagens ou use arquivos menores.');
          return currentForm;
        }

        return { ...currentForm, photos: nextPhotos };
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar fotos');
    } finally {
      setProcessingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setForm((currentForm) => ({
      ...currentForm,
      photos: currentForm.photos.filter((_, photoIndex) => photoIndex !== index),
    }));
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success('Texto copiado!'); };

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return list.filter((announcement) => [
      announcement.title,
      announcement.message,
      categoryLabels[announcement.category],
    ].some((value) => value?.toLowerCase().includes(query))
      && (categoryFilter === 'all' || announcement.category === categoryFilter));
  }, [categoryFilter, list, search]);

  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  const monthCount = useMemo(() => {
    const now = new Date();
    return list.filter((announcement) => {
      const createdAt = new Date(announcement.createdAt);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
  }, [list]);

  const totalPages = Math.max(1, Math.ceil(filteredAnnouncements.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedAnnouncements = filteredAnnouncements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const featuredAnnouncement = paginatedAnnouncements[0];
  const compactAnnouncements = paginatedAnnouncements.slice(1);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Comunicados"
      subtitle="Publique avisos claros, categorizados e fáceis de reutilizar."
      eyebrow="Comunicação"
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar comunicados..."
      actions={(
        <Button
          onClick={openCreate}
          icon={<Plus className="h-4 w-4" />}
          className="w-full rounded-xl border-violet-700 bg-violet-700 shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800 sm:w-auto"
        >
          Novo comunicado
        </Button>
      )}
    >
      <section className="mt-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-100/80 bg-white/90 px-6 py-16 text-center shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
              <Megaphone className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              {list.length === 0 ? 'Nenhum comunicado publicado' : 'Nenhum comunicado encontrado'}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              {list.length === 0 ? 'Crie o primeiro comunicado para centralizar avisos aos moradores.' : 'Tente buscar por outro título, categoria ou mensagem.'}
            </p>
            {list.length === 0 && (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="mt-6 border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Criar comunicado
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-6">
                {featuredAnnouncement && (
                  <FeaturedAnnouncementCard
                    announcement={featuredAnnouncement}
                    onCopy={copyText}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                )}

                {compactAnnouncements.length > 0 && (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {compactAnnouncements.map((announcement) => (
                      <CompactAnnouncementCard
                        key={announcement._id}
                        announcement={announcement}
                        onCopy={copyText}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                )}
              </div>

              <aside className="space-y-5">
                <div className="rounded-2xl border border-violet-100/80 bg-white/90 p-6 text-center shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <Megaphone className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-950">{monthCount}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Comunicados ativos neste mês</p>
                </div>

                <div className="rounded-2xl border border-violet-100/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
                  <div className="mb-4 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-violet-700" />
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Filtros rápidos</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((filter) => {
                      const isActive = categoryFilter === filter.value;
                      return (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setCategoryFilter(filter.value)}
                          className={`rounded-full px-3 py-2 text-[11px] font-black transition ${
                            isActive
                              ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700'
                          }`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canGoPrevious}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-violet-100 bg-white px-4 text-sm font-extrabold text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="text-sm font-extrabold text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={!canGoNext}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-extrabold text-violet-700 shadow-sm transition hover:bg-violet-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white disabled:hover:text-violet-700"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar comunicado' : 'Novo comunicado'} size="lg">
        <div className="space-y-4">
          <Input label="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Mensagem *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} />
          <Select label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={catOptions} />
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="announcement-photos" className="block text-xs font-bold tracking-[-0.01em] text-slate-700">
                Fotos do comunicado
              </label>
              <span className="text-[11px] font-bold text-slate-400">{form.photos.length}/{MAX_PHOTOS}</span>
            </div>
            <label
              htmlFor="announcement-photos"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 px-4 py-6 text-center transition hover:border-violet-300 hover:bg-violet-50"
            >
              <ImagePlus className="h-6 w-6 text-violet-700" />
              <span className="mt-2 text-sm font-extrabold text-slate-950">
                {processingPhotos ? 'Processando fotos...' : 'Adicionar várias fotos'}
              </span>
              <span className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG ou WEBP. Até {MAX_PHOTOS} imagens.</span>
            </label>
            <input
              id="announcement-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={processingPhotos || form.photos.length >= MAX_PHOTOS}
              className="sr-only"
            />
            {form.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {form.photos.map((photo, index) => (
                  <div key={`${photo.slice(0, 32)}-${index}`} className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-slate-100">
                    <img src={photo} alt={`Foto ${index + 1} do comunicado`} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/75 text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Remover foto ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="rounded" />
            Fixar comunicado
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} loading={saving || processingPhotos} className="flex-1">Salvar</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir comunicado?"
        description={`O comunicado "${deleteTarget?.title || 'selecionado'}" e suas fotos anexadas serão removidos da lista de publicações. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir comunicado"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PremiumPage>
  );
};

export default AnnouncementsPage;

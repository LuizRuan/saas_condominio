import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import PhotoGrid from '../../components/ui/PhotoGrid';
import { AlertTriangle, CheckCircle2, Clock3, ImageIcon, MessageSquareText, Plus, Send, Siren, Trash2, Upload } from 'lucide-react';
import { categoryLabels, formatDate, getUnitLabel, priorityColors, priorityLabels } from '../../utils/helpers';
import api from '../../services/api';
import { Issue, Unit } from '../../types';
import toast from 'react-hot-toast';
import { useDemo } from '../../contexts/DemoContext';

const categoryOptions = [
  { value: 'noise', label: 'Barulho' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'security', label: 'Segurança' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'garage', label: 'Garagem' },
  { value: 'leak', label: 'Vazamento' },
  { value: 'other', label: 'Outro' },
];

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

const readImageFiles = (files: FileList | null): Promise<string[]> => {
  if (!files?.length) return Promise.resolve([]);

  const selectedFiles = Array.from(files).filter((file) => file.type.startsWith('image/')).slice(0, 6);
  return Promise.all(selectedFiles.map((file) => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  })));
};

const IssuesPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { isDemo, blockAction } = useDemo();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  const { data: issuesResponse, isLoading: loadingIssues } = useQuery<{ data: Issue[] }>({
    queryKey: ['issues', filterStatus, filterPriority],
    queryFn: async () => {
      const { data } = await api.get('/issues', { params: { status: filterStatus || undefined, priority: filterPriority || undefined, limit: 200 } });
      return data;
    },
  });
  const issues: Issue[] = issuesResponse?.data ?? (issuesResponse as unknown as Issue[]) ?? [];

  const { data: units = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await api.get('/units');
      return data;
    },
  });

  const loading = loadingIssues || loadingUnits;

  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Issue | null>(null);
  const [search, setSearch] = useState('');
  const [response, setResponse] = useState('');
  const [replyPhotos, setReplyPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ unitId: '', title: '', description: '', category: 'other', priority: 'medium', photos: [] as string[] });



  const openDetail = (issue: Issue) => { setSelected(issue); setResponse(''); setReplyPhotos([]); setDetailOpen(true); };
  const openCreate = () => {
    setForm({ unitId: '', title: '', description: '', category: 'other', priority: 'medium', photos: [] });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.unitId || !form.title.trim() || !form.description.trim()) {
      toast.error('Unidade, título e descrição são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await api.post('/issues', form);
      toast.success('Ocorrência criada!');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/issues/${selected._id}/status`, { status, response });
      toast.success('Atualizado!'); setDetailOpen(false); queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleCreatePhotos = async (files: FileList | null) => {
    const photos = await readImageFiles(files);
    if (!photos.length) {
      toast.error('Selecione imagens válidas');
      return;
    }
    setForm((current) => ({ ...current, photos: [...current.photos, ...photos].slice(0, 6) }));
  };

  const handleReplyPhotos = async (files: FileList | null) => {
    const photos = await readImageFiles(files);
    if (!photos.length) {
      toast.error('Selecione imagens válidas');
      return;
    }
    setReplyPhotos((current) => [...current, ...photos].slice(0, 6));
  };

  const sendReply = async () => {
    if (!selected) return;
    if (!response.trim() && replyPhotos.length === 0) {
      toast.error('Escreva uma resposta ou anexe uma foto');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post<Issue>(`/issues/${selected._id}/messages`, { message: response, photos: replyPhotos });
      setSelected(data);
      setResponse('');
      setReplyPhotos([]);
      toast.success('Resposta enviada!');
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget._id;
    setSaving(true);
    try {
      await api.delete(`/issues/${deletedId}`);
      toast.success('Ocorrência excluída!');
      setDeleteTarget(null);
      if (selected?._id === deletedId) {
        setDetailOpen(false);
        setSelected(null);
      }
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return issues;

    return issues.filter((issue) => [
      issue.title,
      issue.description,
      getUnitLabel(issue.unitId),
      categoryLabels[issue.category],
      priorityLabels[issue.priority],
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [issues, search]);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Ocorrências"
      subtitle="Acompanhe solicitações dos moradores com prioridade e histórico."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar ocorrências..."
      actions={(
        <Button
          onClick={isDemo ? blockAction : openCreate}
          icon={<Plus className="h-4 w-4" />}
          className="w-full rounded-xl border-violet-700 bg-violet-700 shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800 sm:w-auto"
        >
          Nova ocorrência
        </Button>
      )}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ocorrências" value={issues.length} helper="no filtro atual" icon={<MessageSquareText className="h-4 w-4" />} />
        <MetricCard label="Abertas" value={issues.filter((issue) => issue.status === 'open').length} helper="aguardando" icon={<AlertTriangle className="h-4 w-4" />} iconClass="bg-orange-100 text-orange-700" valueClassName="text-orange-600" />
        <MetricCard label="Em análise" value={issues.filter((issue) => issue.status === 'in_progress').length} helper="em andamento" icon={<Clock3 className="h-4 w-4" />} iconClass="bg-blue-100 text-blue-700" valueClassName="text-blue-700" />
        <MetricCard label="Alta prioridade" value={issues.filter((issue) => issue.priority === 'high').length} helper="críticas" icon={<Siren className="h-4 w-4" />} iconClass="bg-red-100 text-red-700" valueClassName="text-red-600" />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
        <div className="flex flex-col gap-4 border-b border-violet-100/80 px-5 py-5 sm:px-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Lista de Ocorrências</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {search ? `${filteredIssues.length} resultado(s) encontrados` : 'Solicitações abertas e históricas'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              options={[{ value: 'open', label: 'Aberta' }, { value: 'in_progress', label: 'Em análise' }, { value: 'resolved', label: 'Resolvida' }]} placeholder="Todos os status" />
            <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              options={[{ value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }]} placeholder="Todas as prioridades" />
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              {issues.length === 0 ? 'Nenhuma ocorrência encontrada' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              {issues.length === 0 ? 'Crie uma ocorrência interna ou aguarde solicitações dos moradores.' : 'Tente outra busca ou ajuste os filtros.'}
            </p>
            {issues.length === 0 && (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="mt-6 border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Criar ocorrência
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:p-7 xl:grid-cols-2">
            {filteredIssues.map((issue) => (
              <article
                key={issue._id}
                className="rounded-2xl border border-violet-100/80 bg-white p-5 text-left shadow-[0_14px_40px_rgba(76,29,149,0.05)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_20px_50px_rgba(76,29,149,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <button type="button" onClick={() => openDetail(issue)} className="min-w-0 flex-1 text-left">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={issue.status} />
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${priorityColors[issue.priority]}`}>
                        {priorityLabels[issue.priority]}
                      </span>
                    </div>
                    <h3 className="truncate text-base font-extrabold tracking-[-0.03em] text-slate-950">{issue.title}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-400">{getUnitLabel(issue.unitId)} · {categoryLabels[issue.category]} · {formatDate(issue.createdAt)}</p>
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-600">{issue.description}</p>
                    <PhotoGrid photos={issue.photos} title={issue.title} />
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => isDemo ? blockAction() : setDeleteTarget(issue)}
                      className="icon-button hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                      title="Excluir ocorrência"
                      aria-label={`Excluir ocorrência ${issue.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nova ocorrência" size="lg">
        <div className="space-y-4">
          <Select
            label="Unidade *"
            value={form.unitId}
            onChange={(e) => setForm({ ...form, unitId: e.target.value })}
            options={units.map((unit) => ({
              value: unit._id,
              label: `${unit.block ? `Bloco ${unit.block} - ` : ''}Apt ${unit.number}`,
            }))}
            placeholder="Selecione a unidade"
          />
          <Input label="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resumo do problema" />
          <Textarea label="Descrição *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Descreva a ocorrência em detalhes..." />
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 p-4">
            <label className="flex cursor-pointer flex-col items-center justify-center text-center">
              <Upload className="h-6 w-6 text-violet-700" />
              <span className="mt-2 text-sm font-black text-slate-950">Anexar fotos</span>
              <span className="mt-1 text-xs font-semibold text-slate-500">Até 6 imagens para contextualizar a ocorrência.</span>
              <input type="file" accept="image/*" multiple onChange={(event) => handleCreatePhotos(event.target.files)} className="hidden" />
            </label>
            <PhotoGrid photos={form.photos} title="Fotos da ocorrência" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categoryOptions} />
            <Select label="Prioridade" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={priorityOptions} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">Criar ocorrência</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalhes da ocorrência" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${priorityColors[selected.priority]}`}>{priorityLabels[selected.priority]}</span>
                <span className="text-xs font-bold text-slate-400">{categoryLabels[selected.category]}</span>
              </div>
              <h3 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">{selected.title}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{getUnitLabel(selected.unitId)} · {formatDate(selected.createdAt)}</p>
              <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{selected.description}</p>
              <PhotoGrid photos={selected.photos} title={selected.title} />
            </div>

            <div className="rounded-2xl border border-violet-100 bg-white">
              <div className="border-b border-violet-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Histórico</p>
                <h4 className="mt-1 text-sm font-black text-slate-950">Conversa da ocorrência</h4>
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto p-4">
                {(selected.messages?.length ? selected.messages : [{
                  authorRole: 'resident' as const,
                  authorName: 'Morador',
                  message: selected.description,
                  photos: selected.photos,
                  createdAt: selected.createdAt,
                }]).map((message, index) => (
                  <div
                    key={`${message.createdAt}-${index}`}
                    className={`rounded-2xl border p-4 ${message.authorRole === 'admin' ? 'border-blue-100 bg-blue-50' : 'border-violet-100 bg-[#fbf8ff]'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{message.authorName}</p>
                      <span className="text-[11px] font-bold text-slate-400">{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{message.message}</p>
                    <PhotoGrid photos={message.photos} title={`Mensagem de ${message.authorName}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <Textarea label="Resposta do síndico" value={response} onChange={(e) => setResponse(e.target.value)} rows={3} placeholder="Escreva sua resposta..." />
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700 transition hover:border-violet-300 hover:bg-violet-50">
                <ImageIcon className="h-4 w-4" />
                Anexar foto na resposta
                <input type="file" accept="image/*" multiple onChange={(event) => handleReplyPhotos(event.target.files)} className="hidden" />
              </label>
              <PhotoGrid photos={replyPhotos} title="Fotos da resposta" />
              <Button onClick={isDemo ? blockAction : sendReply} loading={saving} icon={<Send className="h-4 w-4" />} className="mt-4 w-full border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Enviar resposta
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" onClick={() => isDemo ? blockAction() : updateStatus('in_progress')} loading={saving}>Em análise</Button>
              <Button variant="success" onClick={() => isDemo ? blockAction() : updateStatus('resolved')} loading={saving} icon={<CheckCircle2 className="h-4 w-4" />}>Resolvida</Button>
              <Button variant="danger" onClick={() => isDemo ? blockAction() : setDeleteTarget(selected)} loading={saving} icon={<Trash2 className="h-4 w-4" />}>Excluir</Button>
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir ocorrência?"
        description={`A ocorrência "${deleteTarget?.title || 'selecionada'}" será removida do histórico do condomínio. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir ocorrência"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PremiumPage>
  );
};

export default IssuesPage;

import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import PhotoGrid from '../../components/ui/PhotoGrid';
import { AlertTriangle, CheckCircle2, Clock3, ImageIcon, MessageSquareText, Plus, Send, Upload } from 'lucide-react';
import { categoryLabels, formatDate, priorityColors, priorityLabels } from '../../utils/helpers';
import api from '../../services/api';
import { Issue } from '../../types';
import toast from 'react-hot-toast';

const catOpts = [
  { value: 'noise', label: 'Barulho' }, { value: 'maintenance', label: 'Manutenção' },
  { value: 'security', label: 'Segurança' }, { value: 'cleaning', label: 'Limpeza' },
  { value: 'garage', label: 'Garagem' }, { value: 'leak', label: 'Vazamento' }, { value: 'other', label: 'Outro' },
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

const MyIssues: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [replyPhotos, setReplyPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium', photos: [] as string[] });

  const load = async () => {
    try { const { data } = await api.get('/issues'); setIssues(data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ title: '', description: '', category: 'other', priority: 'medium', photos: [] });
    setModalOpen(true);
  };

  const openDetail = (issue: Issue) => {
    setSelectedIssue(issue);
    setReply('');
    setReplyPhotos([]);
    setDetailOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title || !form.description) { toast.error('Título e descrição são obrigatórios'); return; }
    setSaving(true);
    try {
      await api.post('/issues', form);
      toast.success('Ocorrência registrada!'); setModalOpen(false); load();
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
    if (!selectedIssue) return;
    if (!reply.trim() && replyPhotos.length === 0) {
      toast.error('Escreva uma resposta ou anexe uma foto');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post<Issue>(`/issues/${selectedIssue._id}/messages`, { message: reply, photos: replyPhotos });
      setSelectedIssue(data);
      setReply('');
      setReplyPhotos([]);
      toast.success('Mensagem enviada!');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return issues;

    return issues.filter((issue) => [
      issue.title,
      issue.description,
      categoryLabels[issue.category],
      priorityLabels[issue.priority],
      issue.response,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [issues, search]);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Minhas Ocorrências"
      subtitle="Registre solicitações e acompanhe as respostas da administração."
      onMenuClick={onMenuClick}
      eyebrow="Área do morador"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar ocorrências..."
      actions={(
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="w-full rounded-xl border-violet-700 bg-violet-700 shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800 sm:w-auto">
          Nova ocorrência
        </Button>
      )}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ocorrências" value={issues.length} helper="registradas" icon={<MessageSquareText className="h-4 w-4" />} />
        <MetricCard label="Abertas" value={issues.filter((issue) => issue.status === 'open').length} helper="aguardando" icon={<AlertTriangle className="h-4 w-4" />} iconClass="bg-orange-100 text-orange-700" valueClassName="text-orange-600" />
        <MetricCard label="Em análise" value={issues.filter((issue) => issue.status === 'in_progress').length} helper="andamento" icon={<Clock3 className="h-4 w-4" />} iconClass="bg-blue-100 text-blue-700" valueClassName="text-blue-700" />
        <MetricCard label="Resolvidas" value={issues.filter((issue) => issue.status === 'resolved').length} helper="concluídas" icon={<CheckCircle2 className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" valueClassName="text-emerald-700" />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
        <div className="border-b border-violet-100/80 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Histórico de Ocorrências</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {search ? `${filteredIssues.length} resultado(s) encontrados` : 'Solicitações enviadas à administração'}
          </p>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              {issues.length === 0 ? 'Nenhuma ocorrência aberta' : 'Nenhuma ocorrência encontrada'}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              {issues.length === 0 ? 'Abra uma ocorrência quando precisar acionar a administração.' : 'Tente buscar por outro título, categoria ou resposta.'}
            </p>
            {issues.length === 0 && (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="mt-6 border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Abrir ocorrência
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:p-7 xl:grid-cols-2">
            {filteredIssues.map((issue) => (
              <article key={issue._id} className="rounded-2xl border border-violet-100/80 bg-white p-5 shadow-[0_14px_40px_rgba(76,29,149,0.05)]">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={issue.status} />
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${priorityColors[issue.priority]}`}>{priorityLabels[issue.priority]}</span>
                </div>
                <h3 className="text-base font-extrabold tracking-[-0.03em] text-slate-950">{issue.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{issue.description}</p>
                <PhotoGrid photos={issue.photos} title={issue.title} />
                <p className="mt-4 text-xs font-bold text-slate-400">{categoryLabels[issue.category]} · {formatDate(issue.createdAt)}</p>
                {issue.response && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Resposta do síndico</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-blue-900">{issue.response}</p>
                  </div>
                )}
                <Button variant="secondary" size="sm" onClick={() => openDetail(issue)} className="mt-4">
                  Ver conversa
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova ocorrência">
        <div className="space-y-4">
          <Input label="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resumo do problema" />
          <Textarea label="Descrição *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Descreva o problema em detalhes..." />
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 p-4">
            <label className="flex cursor-pointer flex-col items-center justify-center text-center">
              <Upload className="h-6 w-6 text-violet-700" />
              <span className="mt-2 text-sm font-black text-slate-950">Anexar fotos</span>
              <span className="mt-1 text-xs font-semibold text-slate-500">Fotos ajudam a administração a entender melhor.</span>
              <input type="file" accept="image/*" multiple onChange={(event) => handleCreatePhotos(event.target.files)} className="hidden" />
            </label>
            <PhotoGrid photos={form.photos} title="Fotos da ocorrência" />
          </div>
          <Select label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={catOpts} />
          <Select label="Prioridade" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={[{ value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }]} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">Registrar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Conversa da ocorrência" size="lg">
        {selectedIssue && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedIssue.status} />
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${priorityColors[selectedIssue.priority]}`}>{priorityLabels[selectedIssue.priority]}</span>
                <span className="text-xs font-bold text-slate-400">{categoryLabels[selectedIssue.category]}</span>
              </div>
              <h3 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">{selectedIssue.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{selectedIssue.description}</p>
              <PhotoGrid photos={selectedIssue.photos} title={selectedIssue.title} />
            </div>

            <div className="rounded-2xl border border-violet-100 bg-white">
              <div className="max-h-80 space-y-3 overflow-y-auto p-4">
                {(selectedIssue.messages?.length ? selectedIssue.messages : [{
                  authorRole: 'resident' as const,
                  authorName: 'Você',
                  message: selectedIssue.description,
                  photos: selectedIssue.photos,
                  createdAt: selectedIssue.createdAt,
                }]).map((message, index) => (
                  <div
                    key={`${message.createdAt}-${index}`}
                    className={`rounded-2xl border p-4 ${message.authorRole === 'resident' ? 'border-violet-100 bg-[#fbf8ff]' : 'border-blue-100 bg-blue-50'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{message.authorRole === 'resident' ? 'Você' : message.authorName}</p>
                      <span className="text-[11px] font-bold text-slate-400">{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{message.message}</p>
                    <PhotoGrid photos={message.photos} title={`Mensagem de ${message.authorName}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <Textarea label="Responder" value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Envie uma atualização ou complemento..." />
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700 transition hover:border-violet-300 hover:bg-violet-50">
                <ImageIcon className="h-4 w-4" />
                Anexar foto
                <input type="file" accept="image/*" multiple onChange={(event) => handleReplyPhotos(event.target.files)} className="hidden" />
              </label>
              <PhotoGrid photos={replyPhotos} title="Fotos da resposta" />
              <Button onClick={sendReply} loading={saving} icon={<Send className="h-4 w-4" />} className="mt-4 w-full border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Enviar mensagem
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PremiumPage>
  );
};

export default MyIssues;

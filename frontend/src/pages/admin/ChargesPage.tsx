import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  ImageIcon,
  Layers,
  MessageCircle,
  Plus,
  Receipt,
  Trash2,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, getUnitLabel } from '../../utils/helpers';
import { generateWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';
import api from '../../services/api';
import { Charge, Condominium, Unit } from '../../types';
import toast from 'react-hot-toast';

const ChargesPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const { data: chargesResponse, isLoading: loadingCharges } = useQuery<{ data: Charge[] }>({
    queryKey: ['charges', filterStatus, filterMonth],
    queryFn: async () => {
      const { data } = await api.get('/charges', { 
        params: { status: filterStatus || undefined, referenceMonth: filterMonth || undefined, limit: 200 } 
      });
      return data;
    },
  });
  const charges: Charge[] = chargesResponse?.data ?? (chargesResponse as unknown as Charge[]) ?? [];

  const { data: units = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await api.get('/units');
      return data;
    },
  });

  const { data: condo = null, isLoading: loadingCondo } = useQuery<Condominium | null>({
    queryKey: ['my-condominium'],
    queryFn: async () => {
      const { data } = await api.get('/condominiums/my');
      return data;
    },
  });

  const loading = loadingCharges || loadingUnits || loadingCondo;

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [whatsOpen, setWhatsOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Charge | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ unitId: '', referenceMonth: '', amount: '', dueDate: '', description: 'Taxa condominial' });
  const [bulkForm, setBulkForm] = useState({ referenceMonth: '', amount: '', dueDate: '', description: 'Taxa condominial' });



  const handleCreate = async () => {
    if (!form.unitId || !form.referenceMonth || !form.amount || !form.dueDate) { toast.error('Preencha todos os campos'); return; }
    setSaving(true);
    try {
      await api.post('/charges', { ...form, amount: Number(form.amount) });
      toast.success('Cobrança criada!'); setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['charges'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleBulk = async () => {
    if (!bulkForm.referenceMonth || !bulkForm.amount || !bulkForm.dueDate) { toast.error('Preencha todos os campos'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/charges/bulk', { ...bulkForm, amount: Number(bulkForm.amount) });
      toast.success(data.message); setBulkOpen(false); queryClient.invalidateQueries({ queryKey: ['charges'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const markPaid = async (id: string, fromProof = false) => {
    try { await api.patch(`/charges/${id}/mark-paid`, { fromProof }); toast.success(fromProof ? 'Comprovante aprovado!' : 'Marcado como pago!'); setProofOpen(false); queryClient.invalidateQueries({ queryKey: ['charges'] }); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
  };

  const markPending = async (id: string) => {
    try { await api.patch(`/charges/${id}/mark-pending`); toast.success('Marcado como pendente!'); queryClient.invalidateQueries({ queryKey: ['charges'] }); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
  };

  const rejectProof = async (id: string) => {
    try {
      await api.patch(`/charges/${id}/reject-proof`);
      toast.success('Comprovante rejeitado!');
      setProofOpen(false);
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/charges/${deleteTarget._id}`);
      toast.success('Cobrança excluída!');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const exportCsv = async () => {
    try {
      const { data } = await api.get('/charges/reports/export.csv', {
        params: { status: filterStatus || undefined, referenceMonth: filterMonth || undefined },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cobrancas-${filterMonth || 'geral'}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível exportar o relatório');
    }
  };

  const handleWhatsApp = (charge: Charge, type: 'reminder' | 'due_today' | 'friendly_late' | 'formal_late') => {
    const resident = typeof charge.residentId === 'object' ? charge.residentId : null;
    if (!resident?.phone) { toast.error('Morador sem telefone cadastrado'); return; }
    const msg = generateWhatsAppMessage(type, {
      name: resident.name, month: charge.referenceMonth,
      amount: charge.amount.toFixed(2), dueDate: formatDate(charge.dueDate),
      pixKey: condo?.pixKey || '',
    });
    openWhatsApp(resident.phone, msg);
  };

  const copyMessage = (charge: Charge, type: 'reminder' | 'due_today' | 'friendly_late' | 'formal_late') => {
    const resident = typeof charge.residentId === 'object' ? charge.residentId : null;
    const msg = generateWhatsAppMessage(type, {
      name: resident?.name || 'Morador', month: charge.referenceMonth,
      amount: charge.amount.toFixed(2), dueDate: formatDate(charge.dueDate),
      pixKey: condo?.pixKey || '',
    });
    navigator.clipboard.writeText(msg);
    toast.success('Mensagem copiada!');
  };

  const openCreate = () => {
    setForm({ unitId: '', referenceMonth: '', amount: condo?.defaultFee?.toString() || '', dueDate: '', description: 'Taxa condominial' });
    setModalOpen(true);
  };

  const filteredCharges = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return charges;

    return charges.filter((charge) => {
      const resident = typeof charge.residentId === 'object' ? charge.residentId : null;
      return [
        getUnitLabel(charge.unitId),
        resident?.name,
        charge.referenceMonth,
        charge.description,
        charge.status,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [charges, search]);

  const sumByStatus = (status: Charge['status']) => charges
    .filter((charge) => charge.status === status)
    .reduce((total, charge) => total + charge.amount, 0);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Cobranças"
      subtitle="Gerencie vencimentos, status e mensagens de cobrança em um só lugar."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar cobranças, unidades..."
      actions={(
        <>
          <Button variant="secondary" onClick={() => setBulkOpen(true)} icon={<Layers className="h-4 w-4" />} className="w-full sm:w-auto">Em massa</Button>
          <Button variant="secondary" onClick={exportCsv} icon={<Download className="h-4 w-4" />} className="w-full sm:w-auto">Exportar CSV</Button>
          <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">Nova cobrança</Button>
        </>
      )}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Cobranças" value={charges.length} helper="no filtro atual" icon={<Receipt className="h-4 w-4" />} />
        <MetricCard label="Recebido" value={formatCurrency(sumByStatus('paid'))} helper="pagas" icon={<CheckCircle2 className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" valueClassName="text-emerald-700" />
        <MetricCard label="A receber" value={formatCurrency(sumByStatus('pending'))} helper="pendentes" icon={<WalletCards className="h-4 w-4" />} iconClass="bg-blue-100 text-blue-700" valueClassName="text-blue-700" />
        <MetricCard label="Em atraso" value={formatCurrency(sumByStatus('late'))} helper="atenção" icon={<AlertTriangle className="h-4 w-4" />} iconClass="bg-red-100 text-red-700" valueClassName="text-red-600" />
        <MetricCard label="Comprovantes" value={charges.filter((charge) => charge.proofStatus === 'submitted').length} helper="para revisar" icon={<FileCheck2 className="h-4 w-4" />} iconClass="bg-fuchsia-100 text-fuchsia-700" valueClassName="text-fuchsia-700" />
      </section>

      <section className="data-table-wrapper mt-6">
        <div className="data-table-header">
          <div>
            <h2 className="section-title">Lista de Cobranças</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {search ? `${filteredCharges.length} resultado(s) encontrados` : 'Valores e vencimentos do condomínio'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              options={[{ value: 'pending', label: 'Pendente' }, { value: 'paid', label: 'Pago' }, { value: 'late', label: 'Atrasado' }]} placeholder="Todos os status" />
            <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} placeholder="Mês" />
          </div>
        </div>

        {filteredCharges.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-800">
              {charges.length === 0 ? 'Nenhuma cobrança encontrada' : 'Nenhum resultado'}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm font-medium text-slate-400">
              {charges.length === 0 ? 'Crie uma cobrança individual ou em massa para começar.' : 'Tente ajustar os filtros de busca.'}
            </p>
          </div>
        ) : (
          <>
            <div className="data-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Morador</th>
                    <th>Referência</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Comprovante</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCharges.map((charge) => {
                    const resident = typeof charge.residentId === 'object' ? charge.residentId : null;
                    return (
                      <tr key={charge._id}>
                        <td className="font-bold">{getUnitLabel(charge.unitId)}</td>
                        <td>
                          <p className="font-semibold text-slate-800">{resident?.name || '—'}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{resident?.email || 'Sem e-mail'}</p>
                        </td>
                        <td className="text-slate-500">{charge.referenceMonth}</td>
                        <td className="font-bold">{formatCurrency(charge.amount)}</td>
                        <td className="text-slate-500">{formatDate(charge.dueDate)}</td>
                        <td><StatusBadge status={charge.status} /></td>
                        <td>
                          {charge.proofStatus === 'submitted' ? (
                            <button
                              type="button"
                              onClick={() => { setSelectedCharge(charge); setProofOpen(true); }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 transition hover:bg-violet-100"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              Revisar
                            </button>
                          ) : (
                            <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                              charge.proofStatus === 'approved' ? 'bg-emerald-50 text-emerald-700'
                              : charge.proofStatus === 'rejected' ? 'bg-red-50 text-red-600'
                              : 'bg-slate-100 text-slate-400'
                            }`}>
                              {charge.proofStatus === 'approved' ? 'Aprovado' : charge.proofStatus === 'rejected' ? 'Rejeitado' : 'Sem envio'}
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {charge.status !== 'paid' && (
                              <button type="button" onClick={() => markPaid(charge._id)} title="Marcar como pago" aria-label="Marcar como pago" className="icon-button hover:bg-emerald-50 hover:text-emerald-600">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {charge.status === 'paid' && (
                              <button type="button" onClick={() => markPending(charge._id)} title="Marcar como pendente" aria-label="Marcar como pendente" className="icon-button hover:bg-amber-50 hover:text-amber-600">
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button type="button" onClick={() => { setSelectedCharge(charge); setWhatsOpen(true); }} title="WhatsApp" aria-label="WhatsApp" className="icon-button hover:bg-emerald-50 hover:text-emerald-600">
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setDeleteTarget(charge)} title="Excluir" aria-label="Excluir cobrança" className="icon-button hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3.5 text-xs font-semibold text-slate-400">
              Mostrando <span className="font-bold text-slate-600">{filteredCharges.length}</span> de <span className="font-bold text-slate-600">{charges.length}</span> cobranças
            </div>
          </>
        )}
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova cobrança">
        <div className="space-y-4">
          <Select label="Unidade *" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}
            options={units.map((u) => ({ value: u._id, label: `${u.block ? 'Bl '+u.block+' - ' : ''}Apt ${u.number}` }))} placeholder="Selecione" />
          <Input label="Mês referência *" type="month" value={form.referenceMonth} onChange={(e) => setForm({ ...form, referenceMonth: e.target.value })} />
          <Input label="Valor *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Vencimento *" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">Criar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} title="Cobrança em massa">
        <p className="mb-4 text-sm font-medium text-slate-500">Cria cobrança para todas as unidades ocupadas.</p>
        <div className="space-y-4">
          <Input label="Mês referência *" type="month" value={bulkForm.referenceMonth} onChange={(e) => setBulkForm({ ...bulkForm, referenceMonth: e.target.value })} />
          <Input label="Valor *" type="number" value={bulkForm.amount} onChange={(e) => setBulkForm({ ...bulkForm, amount: e.target.value })} />
          <Input label="Vencimento *" type="date" value={bulkForm.dueDate} onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })} />
          <Input label="Descrição" value={bulkForm.description} onChange={(e) => setBulkForm({ ...bulkForm, description: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setBulkOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleBulk} loading={saving} className="flex-1">Criar cobranças</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={whatsOpen} onClose={() => setWhatsOpen(false)} title="Enviar WhatsApp">
        <div className="space-y-3">
          {(['reminder', 'due_today', 'friendly_late', 'formal_late'] as const).map((type) => {
            const labels = { reminder: 'Lembrete', due_today: 'Dia do vencimento', friendly_late: 'Atraso amigável', formal_late: 'Cobrança formal' };
            return (
              <div key={type} className="rounded-2xl border border-violet-100 bg-white p-4">
                <p className="mb-3 text-sm font-extrabold text-slate-950">{labels[type]}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => selectedCharge && handleWhatsApp(selectedCharge, type)} icon={<MessageCircle className="h-3.5 w-3.5" />}>Enviar</Button>
                  <Button size="sm" variant="secondary" onClick={() => selectedCharge && copyMessage(selectedCharge, type)} icon={<Copy className="h-3.5 w-3.5" />}>Copiar</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal isOpen={proofOpen} onClose={() => setProofOpen(false)} title="Revisar comprovante" size="lg">
        {selectedCharge && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-violet-100 bg-[#fbf8ff] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">Cobrança</p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950">{formatCurrency(selectedCharge.amount)}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {getUnitLabel(selectedCharge.unitId)} · Ref. {selectedCharge.referenceMonth} · Vence {formatDate(selectedCharge.dueDate)}
                  </p>
                </div>
                <StatusBadge status={selectedCharge.status} />
              </div>
              {selectedCharge.proofNote && (
                <div className="mt-4 rounded-2xl border border-white bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Observação do morador</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selectedCharge.proofNote}</p>
                </div>
              )}
            </div>

            {selectedCharge.proofUrl ? (
              <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_18px_55px_rgba(76,29,149,0.08)]">
                <img src={selectedCharge.proofUrl} alt="Comprovante enviado pelo morador" className="max-h-[460px] w-full object-contain bg-slate-50" />
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50 p-8 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-violet-700" />
                <p className="mt-3 text-sm font-black text-slate-950">Sem imagem anexada</p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={() => setProofOpen(false)} className="flex-1">Analisar depois</Button>
              <Button variant="danger" onClick={() => rejectProof(selectedCharge._id)} className="flex-1" icon={<XCircle className="h-4 w-4" />}>Rejeitar</Button>
              <Button variant="success" onClick={() => markPaid(selectedCharge._id, true)} className="flex-1" icon={<CheckCircle className="h-4 w-4" />}>Aprovar e baixar</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir cobrança?"
        description={`A cobrança de ${deleteTarget ? formatCurrency(deleteTarget.amount) : 'valor selecionado'} será removida do histórico financeiro. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir cobrança"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PremiumPage>
  );
};

export default ChargesPage;

import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import {
  CheckCircle2, Copy, Link2, MessageCircle,
  Pencil, Plus, Send, Trash2,
  UserRoundCog, Users, WalletCards,
} from 'lucide-react';
import { formatDate, formatPhone, getUnitLabel, residentTypeLabels } from '../../utils/helpers';
import api from '../../services/api';
import { Resident, Unit } from '../../types';
import toast from 'react-hot-toast';
import { useDemo } from '../../contexts/DemoContext';

const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'MO';

const typeBadgeClasses: Record<Resident['type'], string> = {
  owner: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  tenant: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  financial_responsible: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
};

const shortTypeLabels: Record<Resident['type'], string> = {
  owner: 'Proprietário',
  tenant: 'Inquilino',
  financial_responsible: 'Resp. Financeiro',
};

const ResidentsPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { isDemo, blockAction } = useDemo();
  const queryClient = useQueryClient();
  
  const { data: residents = [], isLoading: loadingResidents } = useQuery<Resident[]>({
    queryKey: ['residents'],
    queryFn: async () => {
      const { data } = await api.get('/residents');
      return data;
    },
  });

  const { data: units = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await api.get('/units');
      return data;
    },
  });

  const loading = loadingResidents || loadingUnits;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Resident | null>(null);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string; whatsappText: string; expiresAt: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', unitId: '', type: 'owner', isFinancialResponsible: false, createAccount: false, password: '123456' });



  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', unitId: '', type: 'owner', isFinancialResponsible: false, createAccount: false, password: '123456' });
    setModalOpen(true);
  };
  const openEdit = (r: Resident) => {
    setEditing(r);
    const uid = typeof r.unitId === 'object' ? r.unitId._id : r.unitId;
    setForm({ name: r.name, phone: r.phone, email: r.email, unitId: uid, type: r.type, isFinancialResponsible: r.isFinancialResponsible, createAccount: false, password: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.unitId) { toast.error('Nome e unidade são obrigatórios'); return; }
    if (!editing && form.createAccount && !form.email.trim()) { toast.error('Informe o e-mail para criar a conta de acesso'); return; }
    if (!editing && form.createAccount && form.password.length < 6) { toast.error('A senha inicial deve ter pelo menos 6 caracteres'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/residents/${editing._id}`, form); toast.success('Atualizado!'); }
      else { await api.post('/residents', form); toast.success('Cadastrado!'); }
      setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['residents'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget._id;
    setSaving(true);
    try {
      await api.delete(`/residents/${deletedId}`);
      toast.success('Morador excluído!');
      setDeleteTarget(null);
      if (editing?._id === deletedId) { setModalOpen(false); setEditing(null); }
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const generateInvite = async (resident: Resident) => {
    setSaving(true);
    try {
      const { data } = await api.post(`/residents/${resident._id}/invite`);
      setInviteTarget(resident); setInviteResult(data);
      toast.success('Convite gerado!'); queryClient.invalidateQueries({ queryKey: ['residents'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Não foi possível gerar convite'); }
    finally { setSaving(false); }
  };

  const copyInvite = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado!`);
  };

  const openInviteWhatsApp = () => {
    if (!inviteTarget || !inviteResult) return;
    const phone = inviteTarget.phone.replace(/\D/g, '');
    if (!phone) { toast.error('Morador sem telefone cadastrado'); return; }
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(inviteResult.whatsappText)}`, '_blank', 'noopener,noreferrer');
  };

  const filteredResidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return residents;
    return residents.filter((resident) =>
      [resident.name, resident.email, resident.phone, getUnitLabel(resident.unitId), residentTypeLabels[resident.type]]
        .some((v) => v?.toLowerCase().includes(query))
    );
  }, [residents, search]);

  const monthlyNew = useMemo(() => {
    const now = new Date();
    return residents.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [residents]);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Moradores"
      subtitle="Organize responsáveis, proprietários e inquilinos do condomínio."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar moradores, unidades..."
      actions={(
        <Button onClick={isDemo ? blockAction : openCreate} icon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">
          Novo morador
        </Button>
      )}
    >
      {/* Métricas */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total de moradores" value={residents.length} helper={`+${monthlyNew} este mês`} icon={<Users className="h-4 w-4" />} iconClass="bg-blue-100 text-blue-700" />
        <MetricCard label="Responsáveis financeiros" value={residents.filter((r) => r.isFinancialResponsible || r.type === 'financial_responsible').length} helper="Contas vinculadas" icon={<WalletCards className="h-4 w-4" />} iconClass="bg-indigo-100 text-indigo-700" />
        <MetricCard label="Proprietários" value={residents.filter((r) => r.type === 'owner').length} helper="Unidades principais" icon={<UserRoundCog className="h-4 w-4" />} iconClass="bg-slate-100 text-slate-600" />
        <MetricCard label="Inquilinos" value={residents.filter((r) => r.type === 'tenant').length} helper="Moradia ativa" icon={<Users className="h-4 w-4" />} iconClass="bg-slate-100 text-slate-500" />
      </section>

      {/* Tabela */}
      <section className="data-table-wrapper mt-6">
        <div className="data-table-header">
          <div>
            <h2 className="section-title">Lista de Moradores</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {search ? `${filteredResidents.length} resultado(s) encontrados` : 'Cadastro completo dos moradores'}
            </p>
          </div>
        </div>

        {filteredResidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-800">
              {residents.length === 0 ? 'Nenhum morador cadastrado' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm font-medium text-slate-400">
              {residents.length === 0 ? (
                <>
                  Cadastre moradores para liberar acesso ao aplicativo e permitir que eles vejam suas cobranças e enviem ocorrências.<br/>
                  <span className="mt-1 block text-xs text-slate-400">Dica: Convide os moradores enviando um link de acesso por WhatsApp.</span>
                </>
              ) : (
                'Tente buscar por outro nome, e-mail, telefone ou unidade.'
              )}
            </p>
            {residents.length === 0 && (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="mt-6">
                Cadastrar morador
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="data-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Unidade</th>
                    <th>Contato</th>
                    <th>Tipo</th>
                    <th className="text-center">Resp. financeiro</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((resident) => (
                    <tr key={resident._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-blue-600 text-[11px] font-black text-white shadow-sm">
                            {getInitials(resident.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-900">{resident.name}</p>
                            <p className="text-xs text-slate-400">ID {resident._id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-800">{getUnitLabel(resident.unitId)}</p>
                        <p className="text-xs text-slate-400">Unidade vinculada</p>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-800">{resident.phone ? formatPhone(resident.phone) : '—'}</p>
                        <p className="text-xs text-slate-400">{resident.email || 'Sem e-mail'}</p>
                        <span className={`mt-1.5 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold ${resident.userId ? 'bg-emerald-50 text-emerald-700' : resident.inviteToken ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {resident.userId ? 'Conta ativa' : resident.inviteToken ? 'Convite enviado' : 'Sem acesso'}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold ${typeBadgeClasses[resident.type]}`}>
                          {shortTypeLabels[resident.type]}
                        </span>
                      </td>
                      <td className="text-center">
                        {resident.isFinancialResponsible || resident.type === 'financial_responsible' ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {!resident.userId && (
                            <button
                              type="button"
                              onClick={() => isDemo ? blockAction() : generateInvite(resident)}
                              className="icon-button hover:bg-blue-50 hover:text-blue-600"
                              title="Gerar convite"
                              aria-label={`Gerar convite para ${resident.name}`}
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => isDemo ? blockAction() : openEdit(resident)}
                            className="icon-button hover:bg-slate-100 hover:text-slate-700"
                            title="Editar morador"
                            aria-label={`Editar ${resident.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => isDemo ? blockAction() : setDeleteTarget(resident)}
                            className="icon-button hover:bg-red-50 hover:text-red-500"
                            title="Excluir morador"
                            aria-label={`Excluir ${resident.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3.5 text-xs font-semibold text-slate-400">
              Mostrando <span className="font-bold text-slate-600">{filteredResidents.length}</span> de <span className="font-bold text-slate-600">{residents.length}</span> moradores
            </div>
          </>
        )}
      </section>

      {/* Modal criar/editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar morador' : 'Novo morador'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Unidade *" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              options={units.map((u) => ({ value: u._id, label: `${u.block ? 'Bloco ' + u.block + ' - ' : ''}Apt ${u.number}` }))} placeholder="Selecione" />
            <Input
              label="Telefone"
              value={form.phone}
              placeholder="(11) 99999-9999"
              maxLength={15}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 11) val = val.slice(0, 11);
                if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                if (val.length > 9) val = `${val.slice(0, 9)}-${val.slice(9)}`;
                setForm({ ...form, phone: val });
              }}
            />
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[{ value: 'owner', label: 'Proprietário' }, { value: 'tenant', label: 'Inquilino' }, { value: 'financial_responsible', label: 'Resp. Financeiro' }]} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.isFinancialResponsible} onChange={(e) => setForm({ ...form, isFinancialResponsible: e.target.checked })} className="rounded accent-blue-600" />
            Responsável financeiro
          </label>
          {!editing && (
            <>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.createAccount} onChange={(e) => setForm({ ...form, createAccount: e.target.checked })} className="rounded accent-blue-600" />
                Criar conta de acesso para o morador
              </label>
              {form.createAccount && (
                <Input label="Senha inicial" type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              )}
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal convite */}
      <Modal
        isOpen={Boolean(inviteTarget && inviteResult)}
        onClose={() => { setInviteTarget(null); setInviteResult(null); }}
        title="Convite do morador"
        size="lg"
      >
        {inviteTarget && inviteResult && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Acesso do morador</p>
              <h3 className="mt-2 text-xl font-black tracking-[-0.04em]">{inviteTarget.name}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-blue-100">
                Envie este convite para o morador criar a senha e entrar na área do cliente.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Link de ativação</p>
              <p className="mt-2 break-all text-sm font-bold text-slate-900">{inviteResult.inviteUrl}</p>
              <p className="mt-2 text-xs font-medium text-slate-400">Válido até {formatDate(inviteResult.expiresAt)}.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => copyInvite(inviteResult.inviteUrl, 'Link')} icon={<Link2 className="h-4 w-4" />}>
                Copiar link
              </Button>
              <Button variant="secondary" onClick={() => copyInvite(inviteResult.whatsappText, 'Mensagem')} icon={<Copy className="h-4 w-4" />}>
                Copiar texto
              </Button>
              <Button onClick={openInviteWhatsApp} icon={<MessageCircle className="h-4 w-4" />}>
                WhatsApp
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir morador?"
        description={`O cadastro de "${deleteTarget?.name || 'morador selecionado'}" será removido. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir morador"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PremiumPage>
  );
};

export default ResidentsPage;
